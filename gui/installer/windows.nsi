; POIDH Autonomous Bounty Bot - Windows Installer (NSIS)
; This script creates a professional Windows installer for the POIDH Bot GUI

!include "MUI2.nsh"
!include "x64.nsh"

; Basic settings
Name "POIDH Autonomous Bounty Bot"
OutFile "${PROJECT_ROOT}\releases\POIDH-Bot-Setup-${VERSION}-x64.exe"
InstallDir "$PROGRAMFILES64\POIDH Bot"
InstallDirRegKey HKLM "Software\POIDH Bot" "Install_Dir"

; Request admin rights
RequestExecutionLevel admin

; UI Settings
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; Installer sections
Section "Install"
  SetOutPath "$INSTDIR"
  
  ; Copy GUI executable
  File "..\..\dist\POIDH-Bot-GUI.exe"
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\POIDH Bot"
  CreateShortcut "$SMPROGRAMS\POIDH Bot\POIDH Bot GUI.lnk" "$INSTDIR\POIDH-Bot-GUI.exe"
  CreateShortcut "$SMPROGRAMS\POIDH Bot\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\POIDH Bot.lnk" "$INSTDIR\POIDH-Bot-GUI.exe"
  
  ; Write registry
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\POIDH Bot" \
    "DisplayName" "POIDH Autonomous Bounty Bot"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\POIDH Bot" \
    "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\POIDH Bot" \
    "InstallLocation" "$INSTDIR"
  
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
  RMDir /r "$SMPROGRAMS\POIDH Bot"
  Delete "$DESKTOP\POIDH Bot.lnk"
  Delete "$INSTDIR\POIDH-Bot-GUI.exe"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\POIDH Bot"
SectionEnd
