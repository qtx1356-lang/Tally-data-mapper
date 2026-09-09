; ==============================================================================
; EXFIN Tally Data Mapper - Inno Setup Compiler Script
; Target: Windows 10 / Windows 11 (x64)
; Version: 12.0.0
; Architecture: 64-bit native, non-destructive user data separation
; ==============================================================================

#define MyAppName "EXFIN Tally Data Mapper"
#define MyAppVersion "12.0.0"
#define MyAppPublisher "EXFIN Systems Pvt. Ltd."
#define MyAppURL "https://www.exfin.com"
#define MyAppExeName "EXFIN_TallyMapper.exe"

[Setup]
AppId={{9F82A09B-12EF-4F54-94BC-9D12713AB102}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/support
AppUpdatesURL={#MyAppURL}/updates
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=..\THIRD-PARTY-NOTICES.txt
OutputDir=..\dist-installer
OutputBaseFilename=EXFIN_TallyMapper_Setup_x64_v{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequiredOverridesAllowed=dialog commandline
DisableDirPage=no
DisableProgramGroupPage=no
SignTool=signtool /v /a /tr http://timestamp.digicert.com /td sha256 /fd sha256 $f

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
; Application binaries stored strictly in Program Files (read-only execution)
Source: "..\dist\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
; File associations for EXFIN Tally Data Mapper packages
Root: HKCR; Subkey: ".exfinreport"; ValueType: string; ValueName: ""; ValueData: "EXFIN.ReportPackage"; Flags: uninsdeletevalue
Root: HKCR; Subkey: ".exfinmapping"; ValueType: string; ValueName: ""; ValueData: "EXFIN.MappingProfile"; Flags: uninsdeletevalue
Root: HKCR; Subkey: ".exfinbackup"; ValueType: string; ValueName: ""; ValueData: "EXFIN.BackupPackage"; Flags: uninsdeletevalue
Root: HKCR; Subkey: "EXFIN.ReportPackage\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"
Root: HKCR; Subkey: "EXFIN.ReportPackage\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

[Code]
// Custom Pascal Script to guarantee User Data preservation during uninstall
function InitializeUninstall(): Boolean;
var
  PreserveData: Integer;
begin
  PreserveData := MsgBox(
    'Do you want to PRESERVE your EXFIN mappings, report templates, queries, and license data?' + #13#10 + #13#10 +
    'Click [Yes] to KEEP your financial configuration in %AppData%\EXFIN\TallyMapper (Recommended).' + #13#10 +
    'Click [No] to permanently remove all user data.',
    mbConfirmation, MB_YESNOCANCEL
  );

  if PreserveData = IDCANCEL then
  begin
    Result := False;
    Exit;
  end;

  if PreserveData = IDNO then
  begin
    // User requested full purge
    DelTree(ExpandConstant('{userappdata}\EXFIN\TallyMapper'), True, True, True);
  end;

  Result := True;
end;
