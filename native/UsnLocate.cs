using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

namespace HyperFramesSpace
{
    internal static class UsnLocate
    {
        const uint GENERIC_READ = 0x80000000;
        const uint GENERIC_WRITE = 0x40000000;
        const uint FILE_SHARE_READ = 0x00000001;
        const uint FILE_SHARE_WRITE = 0x00000002;
        const uint OPEN_EXISTING = 3;
        const uint FILE_FLAG_BACKUP_SEMANTICS = 0x02000000;
        const uint FILE_ATTRIBUTE_DIRECTORY = 0x00000010;
        const uint FSCTL_CREATE_USN_JOURNAL = 0x000900E7;
        const uint FSCTL_QUERY_USN_JOURNAL = 0x000900F4;
        const uint FSCTL_ENUM_USN_DATA = 0x000900B3;
        const uint DRIVE_FIXED = 3;
        static readonly IntPtr InvalidHandle = new IntPtr(-1);

        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        static extern IntPtr CreateFile(string lpFileName, uint dwDesiredAccess, uint dwShareMode, IntPtr lpSecurityAttributes, uint dwCreationDisposition, uint dwFlagsAndAttributes, IntPtr hTemplateFile);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern bool CloseHandle(IntPtr hObject);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern bool DeviceIoControl(IntPtr hDevice, uint dwIoControlCode, IntPtr lpInBuffer, uint nInBufferSize, IntPtr lpOutBuffer, uint nOutBufferSize, out uint lpBytesReturned, IntPtr lpOverlapped);

        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        static extern bool GetVolumeInformation(string lpRootPathName, StringBuilder lpVolumeNameBuffer, int nVolumeNameSize, out uint lpVolumeSerialNumber, out uint lpMaximumComponentLength, out uint lpFileSystemFlags, StringBuilder lpFileSystemNameBuffer, int nFileSystemNameSize);

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
        static extern uint GetLogicalDriveStrings(uint nBufferLength, char[] lpBuffer);

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
        static extern uint GetDriveType(string lpRootPathName);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern bool GetFileInformationByHandle(IntPtr hFile, out ByHandleFileInformation lpFileInformation);

        [StructLayout(LayoutKind.Sequential)]
        struct ByHandleFileInformation
        {
            public uint FileAttributes;
            public long CreationTime;
            public long LastAccessTime;
            public long LastWriteTime;
            public uint VolumeSerialNumber;
            public uint FileSizeHigh;
            public uint FileSizeLow;
            public uint NumberOfLinks;
            public uint FileIndexHigh;
            public uint FileIndexLow;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct CreateUsnJournalData
        {
            public ulong MaximumSize;
            public ulong AllocationDelta;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct MftEnumDataV1
        {
            public ulong StartFileReferenceNumber;
            public long LowUsn;
            public long HighUsn;
            public ushort MinMajorVersion;
            public ushort MaxMajorVersion;
        }

        sealed class Rec
        {
            public ulong Parent;
            public string Name;
        }

        sealed class VolumeResult
        {
            public string Letter;
            public string FileSystem;
            public int Records;
            public int Hits;
            public ulong JournalId;
            public long NextUsn;
            public string Error;
        }

        static int Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            string name = "hyperframes.json";
            string outPath = null;
            bool probe = false;
            for (int i = 0; i < args.Length; i++)
            {
                string a = args[i];
                if (a == "--name" && i + 1 < args.Length) name = args[++i];
                else if (a == "--out" && i + 1 < args.Length) outPath = args[++i];
                else if (a == "--probe") probe = true;
                else if (a == "--help" || a == "-h")
                {
                    Console.WriteLine("hf-ntfs-locate --name hyperframes.json [--out file.json] [--probe]");
                    return 0;
                }
            }

            if (probe)
            {
                bool canOpen = false;
                int err = 0;
                foreach (string root in ListFixedDrives())
                {
                    IntPtr h = OpenVolume(root);
                    if (h != InvalidHandle)
                    {
                        canOpen = true;
                        CloseHandle(h);
                        break;
                    }
                    err = Marshal.GetLastWin32Error();
                }
                WriteJson("{\"ok\":" + (canOpen ? "true" : "false") + ",\"probe\":true,\"canOpenVolume\":" + (canOpen ? "true" : "false") + ",\"win32\":" + err + ",\"needsElevation\":" + (canOpen ? "false" : "true") + "}", outPath);
                return canOpen ? 0 : 5;
            }

            var dirs = new List<string>();
            var volumes = new List<VolumeResult>();
            bool anyDenied = false;
            bool anyOk = false;
            foreach (string root in ListFixedDrives())
            {
                VolumeResult vol;
                List<string> found = ScanVolume(root, name, out vol);
                volumes.Add(vol);
                if (vol.Error == "access-denied") anyDenied = true;
                if (found != null)
                {
                    anyOk = true;
                    foreach (string d in found)
                    {
                        if (!dirs.Contains(d)) dirs.Add(d);
                    }
                }
            }

            var sb = new StringBuilder();
            sb.Append("{\"ok\":").Append(anyOk || dirs.Count > 0 ? "true" : "false");
            sb.Append(",\"engine\":\"usn\"");
            sb.Append(",\"needsElevation\":").Append(anyDenied && !anyOk ? "true" : "false");
            sb.Append(",\"dirs\":[");
            for (int i = 0; i < dirs.Count; i++)
            {
                if (i > 0) sb.Append(',');
                sb.Append(J(dirs[i]));
            }
            sb.Append("],\"volumes\":[");
            for (int i = 0; i < volumes.Count; i++)
            {
                if (i > 0) sb.Append(',');
                VolumeResult v = volumes[i];
                sb.Append("{\"letter\":").Append(J(v.Letter));
                sb.Append(",\"fileSystem\":").Append(J(v.FileSystem));
                sb.Append(",\"records\":").Append(v.Records);
                sb.Append(",\"hits\":").Append(v.Hits);
                sb.Append(",\"journalId\":").Append(v.JournalId);
                sb.Append(",\"nextUsn\":").Append(v.NextUsn);
                sb.Append(",\"error\":").Append(v.Error == null ? "null" : J(v.Error));
                sb.Append('}');
            }
            sb.Append("]}");
            WriteJson(sb.ToString(), outPath);
            if (anyDenied && !anyOk) return 5;
            return 0;
        }

        static List<string> ScanVolume(string root, string wantName, out VolumeResult info)
        {
            info = new VolumeResult { Letter = root.Substring(0, 1).ToUpperInvariant() };
            string fsName;
            if (!IsNtfsLike(root, out fsName))
            {
                info.Error = "not-ntfs";
                info.FileSystem = fsName;
                return null;
            }
            info.FileSystem = fsName;
            IntPtr vol = OpenVolume(root);
            if (vol == InvalidHandle)
            {
                int err = Marshal.GetLastWin32Error();
                info.Error = err == 5 ? "access-denied" : "open-failed-" + err;
                return null;
            }
            try
            {
                var create = new CreateUsnJournalData { MaximumSize = 0, AllocationDelta = 0 };
                IntPtr inCreate = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(CreateUsnJournalData)));
                Marshal.StructureToPtr(create, inCreate, false);
                uint br;
                bool created = DeviceIoControl(vol, FSCTL_CREATE_USN_JOURNAL, inCreate, (uint)Marshal.SizeOf(typeof(CreateUsnJournalData)), IntPtr.Zero, 0, out br, IntPtr.Zero);
                Marshal.FreeHGlobal(inCreate);
                if (!created)
                {
                    int err = Marshal.GetLastWin32Error();
                    if (err == 5)
                    {
                        info.Error = "access-denied";
                        return null;
                    }
                }

                IntPtr qBuf = Marshal.AllocHGlobal(128);
                bool queried = DeviceIoControl(vol, FSCTL_QUERY_USN_JOURNAL, IntPtr.Zero, 0, qBuf, 128, out br, IntPtr.Zero);
                if (!queried)
                {
                    int err = Marshal.GetLastWin32Error();
                    Marshal.FreeHGlobal(qBuf);
                    info.Error = err == 5 ? "access-denied" : "query-failed-" + err;
                    return null;
                }
                byte[] q = new byte[Math.Max(24, (int)br)];
                Marshal.Copy(qBuf, q, 0, q.Length);
                Marshal.FreeHGlobal(qBuf);
                info.JournalId = BitConverter.ToUInt64(q, 0);
                info.NextUsn = BitConverter.ToInt64(q, 16);

                ulong rootFrn = GetRootFrn(root);
                var map = new Dictionary<ulong, Rec>(256000);
                var hits = new List<ulong>();
                var med = new MftEnumDataV1
                {
                    StartFileReferenceNumber = 0,
                    LowUsn = 0,
                    HighUsn = info.NextUsn,
                    MinMajorVersion = 2,
                    MaxMajorVersion = 3
                };
                int medSize = Marshal.SizeOf(typeof(MftEnumDataV1));
                IntPtr inMed = Marshal.AllocHGlobal(medSize);
                const int bufSize = 256 * 1024;
                IntPtr outBuf = Marshal.AllocHGlobal(bufSize);
                byte[] managed = new byte[bufSize];
                try
                {
                    while (true)
                    {
                        Marshal.StructureToPtr(med, inMed, false);
                        uint bytes;
                        if (!DeviceIoControl(vol, FSCTL_ENUM_USN_DATA, inMed, (uint)medSize, outBuf, (uint)bufSize, out bytes, IntPtr.Zero))
                        {
                            break;
                        }
                        if (bytes < 8) break;
                        Marshal.Copy(outBuf, managed, 0, (int)bytes);
                        med.StartFileReferenceNumber = BitConverter.ToUInt64(managed, 0);
                        int offset = 8;
                        while (offset + 60 <= bytes)
                        {
                            int recLen = BitConverter.ToInt32(managed, offset);
                            if (recLen < 60 || offset + recLen > bytes) break;
                            ulong fileRef = BitConverter.ToUInt64(managed, offset + 8);
                            ulong parentRef = BitConverter.ToUInt64(managed, offset + 16);
                            uint attrs = BitConverter.ToUInt32(managed, offset + 52);
                            ushort nameLen = BitConverter.ToUInt16(managed, offset + 56);
                            ushort nameOff = BitConverter.ToUInt16(managed, offset + 58);
                            if (nameLen == 0 || offset + nameOff + nameLen > bytes)
                            {
                                offset += recLen;
                                continue;
                            }
                            string recName = Encoding.Unicode.GetString(managed, offset + nameOff, nameLen);
                            info.Records++;
                            bool isDir = (attrs & FILE_ATTRIBUTE_DIRECTORY) != 0;
                            bool isHit = string.Equals(recName, wantName, StringComparison.OrdinalIgnoreCase);
                            if (isDir || isHit)
                            {
                                ulong key = Key(fileRef);
                                map[key] = new Rec { Parent = parentRef, Name = recName };
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
                ulong rootKey = Key(rootFrn);
                foreach (ulong hit in hits)
                {
                    string full = BuildPath(map, hit, rootKey, info.Letter);
                    if (string.IsNullOrEmpty(full)) continue;
                    try
                    {
                        if (!File.Exists(full)) continue;
                    }
                    catch { continue; }
                    string dir = Path.GetDirectoryName(full);
                    if (string.IsNullOrEmpty(dir)) continue;
                    if (!dirs.Contains(dir)) dirs.Add(dir);
                    info.Hits++;
                }
                return dirs;
            }
            finally
            {
                CloseHandle(vol);
            }
        }

        static string BuildPath(Dictionary<ulong, Rec> map, ulong frn, ulong rootKey, string letter)
        {
            var parts = new List<string>(16);
            ulong cur = frn;
            int guard = 0;
            while (cur != 0 && Key(cur) != rootKey && guard++ < 512)
            {
                Rec rec;
                if (!map.TryGetValue(Key(cur), out rec)) return null;
                if (!string.IsNullOrEmpty(rec.Name) && rec.Name != "." && rec.Name != "..") parts.Add(rec.Name);
                ulong parent = rec.Parent;
                if (Key(parent) == Key(cur)) break;
                cur = parent;
            }
            if (parts.Count == 0) return null;
            parts.Reverse();
            var sb = new StringBuilder();
            sb.Append(letter).Append(":\\");
            for (int i = 0; i < parts.Count; i++)
            {
                if (i > 0) sb.Append('\\');
                sb.Append(parts[i]);
            }
            return sb.ToString();
        }

        static ulong GetRootFrn(string root)
        {
            IntPtr h = CreateFile(root.TrimEnd('\\'), GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE, IntPtr.Zero, OPEN_EXISTING, FILE_FLAG_BACKUP_SEMANTICS, IntPtr.Zero);
            if (h == InvalidHandle) return 5;
            try
            {
                ByHandleFileInformation info;
                if (!GetFileInformationByHandle(h, out info)) return 5;
                return ((ulong)info.FileIndexHigh << 32) | info.FileIndexLow;
            }
            finally { CloseHandle(h); }
        }

        static IntPtr OpenVolume(string root)
        {
            string letter = root.Substring(0, 1);
            string path = "\\\\.\\" + letter + ":";
            return CreateFile(path, GENERIC_READ | GENERIC_WRITE, FILE_SHARE_READ | FILE_SHARE_WRITE, IntPtr.Zero, OPEN_EXISTING, FILE_FLAG_BACKUP_SEMANTICS, IntPtr.Zero);
        }

        static bool IsNtfsLike(string root, out string fsName)
        {
            var fs = new StringBuilder(32);
            uint serial, maxLen, flags;
            bool ok = GetVolumeInformation(root, null, 0, out serial, out maxLen, out flags, fs, fs.Capacity);
            fsName = ok ? fs.ToString() : "";
            if (!ok) return false;
            return fsName.Equals("NTFS", StringComparison.OrdinalIgnoreCase) || fsName.Equals("ReFS", StringComparison.OrdinalIgnoreCase);
        }

        static List<string> ListFixedDrives()
        {
            var list = new List<string>();
            char[] buf = new char[1024];
            uint n = GetLogicalDriveStrings(1024, buf);
            if (n == 0) return list;
            int i = 0;
            while (i < n)
            {
                var sb = new StringBuilder();
                while (i < n && buf[i] != 0) sb.Append(buf[i++]);
                i++;
                string root = sb.ToString();
                if (root.Length >= 2 && GetDriveType(root) == DRIVE_FIXED) list.Add(root);
            }
            return list;
        }

        static ulong Key(ulong frn) { return frn & 0x0000FFFFFFFFFFFFUL; }

        static string J(string s)
        {
            if (s == null) return "null";
            var sb = new StringBuilder(s.Length + 8);
            sb.Append('"');
            foreach (char c in s)
            {
                if (c == '\\' || c == '"') sb.Append('\\').Append(c);
                else if (c == '\n') sb.Append("\\n");
                else if (c == '\r') sb.Append("\\r");
                else sb.Append(c);
            }
            sb.Append('"');
            return sb.ToString();
        }

        static void WriteJson(string json, string outPath)
        {
            Console.WriteLine(json);
            if (string.IsNullOrEmpty(outPath)) return;
            string dir = Path.GetDirectoryName(outPath);
            if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
            File.WriteAllText(outPath, json, new UTF8Encoding(false));
        }
    }
}
