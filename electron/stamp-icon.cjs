const fs = require('fs');
const path = require('path');
const ResEdit = require('resedit');

function parseVersion(raw) {
  const parts = String(raw || '1.0.0').split(/[^\d]+/).map((n) => Number(n) || 0);
  while (parts.length < 4) parts.push(0);
  return parts.slice(0, 4);
}

function stampWindowsExecutable(exePath, options) {
  const icoPath = options.icoPath;
  const version = parseVersion(options.version);
  const productName = options.productName || 'HyperFramesSpace';
  if (!exePath || !fs.existsSync(exePath)) {
    throw new Error('missing exe: ' + exePath);
  }
  if (!icoPath || !fs.existsSync(icoPath)) {
    throw new Error('missing icon: ' + icoPath);
  }

  const data = fs.readFileSync(exePath);
  const exe = ResEdit.NtExecutable.from(data, { ignoreCert: true });
  const res = ResEdit.NtExecutableResource.from(exe);
  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
  const icons = iconFile.icons.map((item) => item.data);
  const existing = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);

  if (existing.length) {
    existing.forEach((group) => {
      ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, group.id, group.lang, icons);
    });
  } else {
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, 1, 1033, icons);
  }

  let viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
  if (!viList.length) {
    viList = [ResEdit.Resource.VersionInfo.createEmpty()];
  }
  const vi = viList[0];
  const [maj, min, pat, build] = version;
  vi.setFileVersion(maj, min, pat, build, 1033);
  vi.setProductVersion(maj, min, pat, build, 1033);
  vi.setStringValues(
    { lang: 1033, codepage: 1200 },
    {
      FileDescription: productName,
      FileVersion: version.join('.'),
      InternalName: productName,
      OriginalFilename: productName + '.exe',
      ProductName: productName,
      ProductVersion: version.join('.'),
      CompanyName: productName
    }
  );
  vi.outputToResourceEntries(res.entries);
  res.outputResource(exe);
  const out = Buffer.from(exe.generate());
  const tmp = exePath + '.stamped';
  fs.writeFileSync(tmp, out);
  fs.renameSync(tmp, exePath);
  return exePath;
}

module.exports = { stampWindowsExecutable };
