const builder = require("electron-builder");
if(process.platform === "win32") {
	builder.build({
		targets: builder.Platform.WINDOWS.createTarget("nsis", [builder.Arch.x64])
	});
} else if(process.platform === "darwin") {
	builder.build({
		targets: builder.Platform.OSX.createTarget()
	});
}
// TODO: build Linux
