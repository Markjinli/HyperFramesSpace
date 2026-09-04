using System.Runtime.InteropServices;
using System.Text;

namespace HyperFramesSpace.Core;

public sealed class UsnLocateResult
{
    public bool Ok { get; init; }
    public bool NeedsElevation { get; init; }
    public IReadOnlyList<string> Dirs { get; init; } = Array.Empty<string>();
    public string Error { get; init; } = "";
}

/// <summary>NTFS MFT/USN locator for hyperframes.json. Full volume enum; hydrate is incremental by mtime.</summary>
public static class UsnIndexer
{
    const uint GENERIC_READ = 0x80000000;
    const uint GENERIC_WRITE = 0x40000000;
    const uint FILE_SHARE_READ = 1, FILE_SHARE_WRITE = 2, OPEN_EXISTING = 3;
    const uint FILE_FLAG_BACKUP_SEMANTICS = 0x02000000;
    const uint FILE_ATTRIBUTE_DIRECTORY = 0x10;
    const uint FSCTL_CREATE_USN_JOURNAL = 0x000900E7;
    const uint FSCTL_QUERY_USN_JOURNAL = 0x000900F4;
    const uint FSCTL_ENUM_USN_DATA = 0x000900B3;
    const uint DRIVE_FIXED = 3;
    static readonly IntPtr Invalid = new(-1);

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern IntPtr CreateFile(string lpFileName, uint access, uint share, IntPtr sec, uint disp, uint flags, IntPtr template);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool CloseHandle(IntPtr h);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool DeviceIoControl(IntPtr h, uint code, IntPtr inBuf, uint inSize, IntPtr outBuf, uint outSize, out uint returned, IntPtr overlapped);
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool GetVolumeInformation(string root, StringBuilder? vol, int volSize, out uint serial, out uint maxLen, out uint flags, StringBuilder fs, int fsSize);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern uint GetLogicalDriveStrings(uint n, char[] buf);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern uint GetDriveType(string root);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool GetFileInformationByHandle(IntPtr h, out ByHandleFileInformation info);

    [StructLayout(LayoutKind.Sequential)]
    struct ByHandleFileInformation
    {
        public uint FileAttributes; public long CreationTime, LastAccessTime, LastWriteTime;
        public uint VolumeSerialNumber, FileSizeHigh, FileSizeLow, NumberOfLinks, FileIndexHigh, FileIndexLow;
    }
    [StructLayout(LayoutKind.Sequential)]
    struct CreateUsnJournalData { public ulong MaximumSize, AllocationDelta; }
    [StructLayout(LayoutKind.Sequential)]
    struct MftEnumDataV1
    {
        public ulong StartFileReferenceNumber; public long LowUsn, HighUsn;
        public ushort MinMajorVersion, MaxMajorVersion;
    }
    sealed class Rec { public ulong Parent; public string Name = ""; }

    public static UsnLocateResult Locate(string fileName = "hyperframes.json", IReadOnlyList<string>? onlyDrives = null)
    {
        var dirs = new List<string>();
        var denied = false;
        var anyOk = false;
        foreach (var root in FilterDrives(ListFixedDrives(), onlyDrives))
        {
            var found = ScanVolume(root, fileName, out var err);
            if (err == "access-denied") denied = true;
            if (found == null) continue;
            anyOk = true;
            foreach (var d in found)
            {
                if (!dirs.Contains(d)) dirs.Add(d);
            }
        }
        return new UsnLocateResult
        {
            Ok = anyOk || dirs.Count > 0,
            NeedsElevation = denied && !anyOk,
            Dirs = dirs,
            Error = denied && !anyOk ? "access-denied" : ""
        };
    }

    static List<string>? ScanVolume(string root, string wantName, out string? error)
    {
        error = null;
        if (!IsNtfsLike(root, out _))
        {
            error = "not-ntfs";
            return null;
        }
        var vol = OpenVolume(root);
        if (vol == Invalid)
        {
            error = Marshal.GetLastWin32Error() == 5 ? "access-denied" : "open-failed";
            return null;
        }
        try
        {
            var create = new CreateUsnJournalData();
            var inCreate = Marshal.AllocHGlobal(Marshal.SizeOf<CreateUsnJournalData>());
            Marshal.StructureToPtr(create, inCreate, false);
            DeviceIoControl(vol, FSCTL_CREATE_USN_JOURNAL, inCreate, (uint)Marshal.SizeOf<CreateUsnJournalData>(), IntPtr.Zero, 0, out _, IntPtr.Zero);
            Marshal.FreeHGlobal(inCreate);
            if (Marshal.GetLastWin32Error() == 5)
            {
                error = "access-denied";
                return null;
            }

            var qBuf = Marshal.AllocHGlobal(128);
            if (!DeviceIoControl(vol, FSCTL_QUERY_USN_JOURNAL, IntPtr.Zero, 0, qBuf, 128, out var br, IntPtr.Zero))
            {
                var err = Marshal.GetLastWin32Error();
                Marshal.FreeHGlobal(qBuf);
                error = err == 5 ? "access-denied" : "query-failed";
                return null;
            }
            var q = new byte[Math.Max(24, (int)br)];
            Marshal.Copy(qBuf, q, 0, q.Length);
            Marshal.FreeHGlobal(qBuf);
            var nextUsn = BitConverter.ToInt64(q, 16);
            var rootFrn = GetRootFrn(root);
            var map = new Dictionary<ulong, Rec>(256000);
            var hits = new List<ulong>();
            var med = new MftEnumDataV1 { HighUsn = nextUsn, MinMajorVersion = 2, MaxMajorVersion = 3 };
            var medSize = Marshal.SizeOf<MftEnumDataV1>();
            var inMed = Marshal.AllocHGlobal(medSize);
            const int bufSize = 256 * 1024;
            var outBuf = Marshal.AllocHGlobal(bufSize);
            var managed = new byte[bufSize];
            try
            {
                while (true)
                {
                    Marshal.StructureToPtr(med, inMed, false);
                    if (!DeviceIoControl(vol, FSCTL_ENUM_USN_DATA, inMed, (uint)medSize, outBuf, bufSize, out var bytes, IntPtr.Zero))
                        break;
                    if (bytes < 8) break;
                    Marshal.Copy(outBuf, managed, 0, (int)bytes);
                    med.StartFileReferenceNumber = BitConverter.ToUInt64(managed, 0);
                    var offset = 8;
                    while (offset + 60 <= bytes)
                    {
                        var recLen = BitConverter.ToInt32(managed, offset);
                        if (recLen < 60 || offset + recLen > bytes) break;
                        var fileRef = BitConverter.ToUInt64(managed, offset + 8);
                        var parentRef = BitConverter.ToUInt64(managed, offset + 16);
                        var attrs = BitConverter.ToUInt32(managed, offset + 52);
                        var nameLen = BitConverter.ToUInt16(managed, offset + 56);
                        var nameOff = BitConverter.ToUInt16(managed, offset + 58);
                        if (nameLen == 0 || offset + nameOff + nameLen > bytes) { offset += recLen; continue; }
                        var recName = Encoding.Unicode.GetString(managed, offset + nameOff, nameLen);
                        var isDir = (attrs & FILE_ATTRIBUTE_DIRECTORY) != 0;
                        var isHit = recName.Equals(wantName, StringComparison.OrdinalIgnoreCase);
                        if (isDir || isHit)
                        {
                            map[Key(fileRef)] = new Rec { Parent = parentRef, Name = recName };
                            if (isHit) hits.Add(fileRef);
                        }
                        offset += recLen;
                    }
                }
            }
            finally
            {
                Marshal.FreeHGlobal(inMed);
                Marshal.FreeHGlobal(outBuf);
            }

            var dirs = new List<string>();
            var rootKey = Key(rootFrn);
            var letter = root[..1].ToUpperInvariant();
            foreach (var hit in hits)
            {
                var full = BuildPath(map, hit, rootKey, letter);
                if (string.IsNullOrEmpty(full) || !File.Exists(full)) continue;
                var dir = Path.GetDirectoryName(full);
                if (!string.IsNullOrEmpty(dir) && !dirs.Contains(dir)) dirs.Add(dir);
            }
            return dirs;
        }
        finally { CloseHandle(vol); }
    }

    static string? BuildPath(Dictionary<ulong, Rec> map, ulong frn, ulong rootKey, string letter)
    {
        var parts = new List<string>(16);
        var cur = frn;
        var guard = 0;
        while (cur != 0 && Key(cur) != rootKey && guard++ < 512)
        {
            if (!map.TryGetValue(Key(cur), out var rec)) return null;
            if (!string.IsNullOrEmpty(rec.Name) && rec.Name is not "." and not "..") parts.Add(rec.Name);
            if (Key(rec.Parent) == Key(cur)) break;
            cur = rec.Parent;
        }
        if (parts.Count == 0) return null;
        parts.Reverse();
        return letter + ":\\" + string.Join("\\", parts);
    }

    static ulong GetRootFrn(string root)
    {
        var h = CreateFile(root.TrimEnd('\\'), GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE, IntPtr.Zero, OPEN_EXISTING, FILE_FLAG_BACKUP_SEMANTICS, IntPtr.Zero);
        if (h == Invalid) return 5;
        try
        {
            if (!GetFileInformationByHandle(h, out var info)) return 5;
            return ((ulong)info.FileIndexHigh << 32) | info.FileIndexLow;
        }
        finally { CloseHandle(h); }
    }

    static IntPtr OpenVolume(string root) =>
        CreateFile("\\\\.\\" + root[..1] + ":", GENERIC_READ | GENERIC_WRITE, FILE_SHARE_READ | FILE_SHARE_WRITE, IntPtr.Zero, OPEN_EXISTING, FILE_FLAG_BACKUP_SEMANTICS, IntPtr.Zero);

    static bool IsNtfsLike(string root, out string fsName)
    {
        var fs = new StringBuilder(32);
        var ok = GetVolumeInformation(root, null, 0, out _, out _, out _, fs, fs.Capacity);
        fsName = ok ? fs.ToString() : "";
        return ok && (fsName.Equals("NTFS", StringComparison.OrdinalIgnoreCase) || fsName.Equals("ReFS", StringComparison.OrdinalIgnoreCase));
    }

    public static List<string> ListFixedDrives()
    {
        var list = new List<string>();
        var buf = new char[1024];
        var n = GetLogicalDriveStrings(1024, buf);
        var i = 0;
        while (i < n)
        {
            var sb = new StringBuilder();
            while (i < n && buf[i] != 0) sb.Append(buf[i++]);
            i++;
            var root = sb.ToString();
            if (root.Length >= 2 && GetDriveType(root) == DRIVE_FIXED) list.Add(root);
        }
        return list;
    }

    static List<string> FilterDrives(List<string> volumes, IReadOnlyList<string>? onlyDrives)
    {
        if (onlyDrives == null || onlyDrives.Count == 0) return volumes;
        var want = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in onlyDrives)
        {
            if (string.IsNullOrWhiteSpace(r)) continue;
            try
            {
                var full = Path.GetFullPath(r);
                if (full.Length >= 2 && full[1] == ':')
                    want.Add(char.ToUpperInvariant(full[0]) + ":\\");
            }
            catch { }
        }
        if (want.Count == 0) return volumes;
        return volumes.Where(v => want.Contains(v)).ToList();
    }

    static ulong Key(ulong frn) => frn & 0x0000FFFFFFFFFFFFUL;
}
