using Microsoft.Data.Sqlite;

namespace HyperFramesSpace.Core;

public sealed class CatalogDb : IDisposable
{
    readonly SqliteConnection _db;

    public CatalogDb(string? path = null)
    {
        var file = path ?? AppPaths.Database;
        Directory.CreateDirectory(Path.GetDirectoryName(file)!);
        _db = new SqliteConnection(new SqliteConnectionStringBuilder
        {
            DataSource = file,
            Cache = SqliteCacheMode.Shared
        }.ToString());
        _db.Open();
        using var pragma = _db.CreateCommand();
        pragma.CommandText = "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA foreign_keys=ON;";
        pragma.ExecuteNonQuery();
        Init();
    }

    void Init()
    {
        using var cmd = _db.CreateCommand();
        cmd.CommandText = """
            CREATE TABLE IF NOT EXISTS projects (
              path TEXT PRIMARY KEY,
              id TEXT NOT NULL,
              name TEXT NOT NULL,
              mtime INTEGER NOT NULL,
              duration REAL NOT NULL DEFAULT 0,
              aspect TEXT NOT NULL DEFAULT '—',
              workflow TEXT NOT NULL DEFAULT '',
              pin TEXT NOT NULL DEFAULT '',
              status TEXT NOT NULL DEFAULT 'ready',
              thumb TEXT,
              brief TEXT NOT NULL DEFAULT '',
              collection TEXT NOT NULL DEFAULT '',
              tags TEXT NOT NULL DEFAULT ''
            );
            CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
            CREATE INDEX IF NOT EXISTS idx_projects_workflow ON projects(workflow);
            CREATE VIRTUAL TABLE IF NOT EXISTS projects_fts USING fts5(
              name, brief, path, collection, tags, content='projects', content_rowid='rowid'
            );
            CREATE TABLE IF NOT EXISTS meta (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            """;
        cmd.ExecuteNonQuery();
    }

    public IReadOnlyList<ProjectRow> Query(string? text = null, string? workflow = null, int limit = 5000)
    {
        using var cmd = _db.CreateCommand();
        var where = new List<string>();
        if (!string.IsNullOrWhiteSpace(workflow) && workflow != "all")
        {
            where.Add("workflow = $wf");
            cmd.Parameters.AddWithValue("$wf", workflow);
        }
        if (!string.IsNullOrWhiteSpace(text))
        {
            where.Add("(name LIKE $q OR brief LIKE $q OR path LIKE $q OR tags LIKE $q OR collection LIKE $q)");
            cmd.Parameters.AddWithValue("$q", "%" + text.Trim() + "%");
        }
        var sql = "SELECT path,id,name,mtime,duration,aspect,workflow,pin,status,thumb,brief,collection,tags FROM projects";
        if (where.Count > 0) sql += " WHERE " + string.Join(" AND ", where);
        sql += " ORDER BY name COLLATE NOCASE LIMIT $limit";
        cmd.Parameters.AddWithValue("$limit", limit);
        cmd.CommandText = sql;
        return ReadRows(cmd);
    }

    public int Count()
    {
        using var cmd = _db.CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM projects";
        return Convert.ToInt32(cmd.ExecuteScalar());
    }

    public ProjectRow? GetById(string id)
    {
        using var cmd = _db.CreateCommand();
        cmd.CommandText = "SELECT path,id,name,mtime,duration,aspect,workflow,pin,status,thumb,brief,collection,tags FROM projects WHERE id = $id LIMIT 1";
        cmd.Parameters.AddWithValue("$id", id);
        var rows = ReadRows(cmd);
        return rows.Count > 0 ? rows[0] : null;
    }

    public ProjectRow? GetByPath(string path)
    {
        using var cmd = _db.CreateCommand();
        cmd.CommandText = "SELECT path,id,name,mtime,duration,aspect,workflow,pin,status,thumb,brief,collection,tags FROM projects WHERE path = $p LIMIT 1";
        cmd.Parameters.AddWithValue("$p", path);
        var rows = ReadRows(cmd);
        return rows.Count > 0 ? rows[0] : null;
    }

    public Dictionary<string, long> AllMtimes()
    {
        var map = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
        using var cmd = _db.CreateCommand();
        cmd.CommandText = "SELECT path, mtime FROM projects";
        using var r = cmd.ExecuteReader();
        while (r.Read()) map[r.GetString(0)] = r.GetInt64(1);
        return map;
    }

    public void Upsert(ProjectRow row)
    {
        using var cmd = _db.CreateCommand();
        cmd.CommandText = """
            INSERT INTO projects(path,id,name,mtime,duration,aspect,workflow,pin,status,thumb,brief,collection,tags)
            VALUES($path,$id,$name,$mtime,$duration,$aspect,$workflow,$pin,$status,$thumb,$brief,$collection,$tags)
            ON CONFLICT(path) DO UPDATE SET
              id=excluded.id, name=excluded.name, mtime=excluded.mtime, duration=excluded.duration,
              aspect=excluded.aspect, workflow=excluded.workflow, pin=excluded.pin, status=excluded.status,
              thumb=excluded.thumb, brief=excluded.brief, collection=excluded.collection, tags=excluded.tags;
            """;
        Bind(cmd, row);
        cmd.ExecuteNonQuery();
    }

    public void DeleteMissing(IReadOnlyCollection<string> livePaths)
    {
        var keep = new HashSet<string>(livePaths, StringComparer.OrdinalIgnoreCase);
        var stale = new List<string>();
        foreach (var kv in AllMtimes())
        {
            if (!keep.Contains(kv.Key)) stale.Add(kv.Key);
        }
        foreach (var path in stale)
        {
            using var cmd = _db.CreateCommand();
            cmd.CommandText = "DELETE FROM projects WHERE path = $p";
            cmd.Parameters.AddWithValue("$p", path);
            cmd.ExecuteNonQuery();
        }
    }

    public void SetMeta(string key, string value)
    {
        using var cmd = _db.CreateCommand();
        cmd.CommandText = "INSERT INTO meta(key,value) VALUES($k,$v) ON CONFLICT(key) DO UPDATE SET value=excluded.value";
        cmd.Parameters.AddWithValue("$k", key);
        cmd.Parameters.AddWithValue("$v", value);
        cmd.ExecuteNonQuery();
    }

    public string? GetMeta(string key)
    {
        using var cmd = _db.CreateCommand();
        cmd.CommandText = "SELECT value FROM meta WHERE key = $k";
        cmd.Parameters.AddWithValue("$k", key);
        return cmd.ExecuteScalar() as string;
    }

    static void Bind(SqliteCommand cmd, ProjectRow row)
    {
        cmd.Parameters.AddWithValue("$path", row.Path);
        cmd.Parameters.AddWithValue("$id", row.Id);
        cmd.Parameters.AddWithValue("$name", row.Name);
        cmd.Parameters.AddWithValue("$mtime", row.Mtime);
        cmd.Parameters.AddWithValue("$duration", row.Duration);
        cmd.Parameters.AddWithValue("$aspect", row.Aspect);
        cmd.Parameters.AddWithValue("$workflow", row.Workflow);
        cmd.Parameters.AddWithValue("$pin", row.Pin);
        cmd.Parameters.AddWithValue("$status", row.Status);
        cmd.Parameters.AddWithValue("$thumb", (object?)row.Thumb ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$brief", row.Brief);
        cmd.Parameters.AddWithValue("$collection", row.Collection);
        cmd.Parameters.AddWithValue("$tags", row.Tags);
    }

    static List<ProjectRow> ReadRows(SqliteCommand cmd)
    {
        var list = new List<ProjectRow>();
        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            list.Add(new ProjectRow
            {
                Path = r.GetString(0),
                Id = r.GetString(1),
                Name = r.GetString(2),
                Mtime = r.GetInt64(3),
                Duration = r.GetDouble(4),
                Aspect = r.GetString(5),
                Workflow = r.GetString(6),
                Pin = r.GetString(7),
                Status = r.GetString(8),
                Thumb = r.IsDBNull(9) ? null : r.GetString(9),
                Brief = r.GetString(10),
                Collection = r.GetString(11),
                Tags = r.GetString(12)
            });
        }
        return list;
    }

    public void Dispose() => _db.Dispose();
}
