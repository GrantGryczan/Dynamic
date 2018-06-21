const fs = require("fs-extra");
const builder = require("electron-builder");
const package = require("../package.json");
const rename = filename => {
	filename = filename.pop();
	fs.rename(filename, `dist/${package.build.productName} ${package.version} Setup${filename.slice(filename.lastIndexOf("."))}`);
};
if(process.platform === "win32") {
	builder.build({
		targets: builder.Platform.WINDOWS.createTarget("nsis", [builder.Arch.x64])
	}).then(rename);
} else if(process.platform === "darwin") {
	builder.build({
		targets: builder.Platform.OSX.createTarget()
	}).then(rename);
}
builder.build({
	targets: builder.Platform.LINUX.createTarget("deb")
}).then(rename);
