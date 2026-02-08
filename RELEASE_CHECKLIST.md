# POIDH Autonomous Bot - Release Checklist

Complete checklist for releasing POIDH Autonomous Bot to production.

## Pre-Release (1-2 weeks before)

### Planning
- [ ] Confirm release version (semantic versioning)
- [ ] Review all merged PRs since last release
- [ ] Identify breaking changes
- [ ] Plan release notes and announcements

### Code Quality
- [ ] Run full test suite: `npm test`
- [ ] Check test coverage
- [ ] Run TypeScript checks: `npm run typecheck`
- [ ] Run linter: `npm run lint`
- [ ] Review code changes: `git log origin/main..HEAD`

### Documentation
- [ ] Update `CHANGELOG.md` with changes
- [ ] Update version in `package.json`
- [ ] Update version in `README.md` if needed
- [ ] Review `PACKAGING.md` for accuracy
- [ ] Update feature documentation if applicable

## Release Day (Final checks)

### 1-2 Hours Before Release

#### Code Verification
- [ ] Verify all tests pass locally
- [ ] Verify builds work locally
- [ ] Check that `.env.example` is up to date
- [ ] Verify no secrets in committed code

#### Build Verification
```bash
npm run clean
npm install
npm run typecheck
npm test
```

#### GUI Build Test
```bash
# macOS/Linux
npm run gui:build

# Windows (if on Windows)
npm run gui:build:win

# Verify executables work
gui/dist/POIDH-Bot-GUI
```

### Release Branch

#### Merge to Main
```bash
# Switch to main
git checkout main
git pull origin main

# Merge standalone-packaging
git merge standalone-packaging

# Verify merge
git log --oneline -5

# Push
git push origin main
```

#### Create Release Tag
```bash
# Create annotated tag (not lightweight)
git tag -a v2.1.0 -m "Release v2.1.0 - Add cross-platform installers"

# Verify tag
git tag -n v2.1.0

# Push tag (triggers GitHub Actions)
git push origin v2.1.0
```

### GitHub Actions

#### Monitor Builds
- [ ] Visit: https://github.com/drdeeks/poidh/actions
- [ ] Watch for workflow runs on new tag
- [ ] Verify all jobs complete:
  - [ ] build-macos
  - [ ] build-linux
  - [ ] build-windows
  - [ ] create-release

#### Build Status
For each platform, verify:
- [ ] PyInstaller build succeeds
- [ ] Installer creation succeeds
- [ ] Artifacts uploaded successfully
- [ ] No errors in logs

#### Expected Artifacts
- [ ] `POIDH-Bot-Setup-v2.1.0-x64.exe` (Windows)
- [ ] `POIDH-Bot-v2.1.0-macos.dmg` (macOS)
- [ ] `POIDH-Bot-v2.1.0-x86_64.AppImage` (Linux)
- [ ] `poidh-bot_v2.1.0_amd64.deb` (Linux)

#### File Sizes (Sanity Check)
- [ ] Windows .exe: 150-250 MB
- [ ] macOS .dmg: 150-250 MB
- [ ] Linux .AppImage: 150-250 MB
- [ ] Linux .deb: 80-150 MB

### GitHub Release

#### Verify Release Created
- [ ] Visit: https://github.com/drdeeks/poidh/releases
- [ ] Verify release v2.1.0 exists
- [ ] Verify all 4 installer files attached
- [ ] Download one file to verify integrity

#### Release Notes
- [ ] Release notes generated from commit messages
- [ ] Installation instructions present
- [ ] Changelog included
- [ ] Known issues listed (if any)

#### Update Release (if needed)
```bash
# Edit release notes on GitHub web UI
# Or via GitHub CLI:
gh release edit v2.1.0 -n "Updated notes"
```

### Post-Release (First 24 hours)

#### Testing
- [ ] Test Windows installer on Windows 10/11
- [ ] Test macOS installer on macOS 11+
- [ ] Test Linux installer on Ubuntu 20.04/22.04
- [ ] Test uninstall process on each platform

#### Verification Steps
**Windows:**
```bash
# Download and run installer
POIDH-Bot-Setup-v2.1.0-x64.exe

# Verify app launches from Start Menu
# Verify app works
# Uninstall via Control Panel
# Verify uninstall completes
```

**macOS:**
```bash
# Download and mount DMG
open POIDH-Bot-v2.1.0-macos.dmg

# Drag app to Applications
# Launch from Applications
# Verify app works
# Delete to uninstall
```

**Linux (AppImage):**
```bash
# Download and make executable
chmod +x POIDH-Bot-v2.1.0-x86_64.AppImage

# Run
./POIDH-Bot-v2.1.0-x86_64.AppImage

# Verify app works
```

**Linux (DEB):**
```bash
# Download and install
sudo apt install ./poidh-bot_v2.1.0_amd64.deb

# Launch
poidh-bot

# Verify app works
# Uninstall
sudo apt remove poidh-bot

# Verify uninstall completes
```

#### Functionality Tests
- [ ] GUI launches successfully
- [ ] Wallet tab loads
- [ ] Config tab accessible
- [ ] Bounty templates load
- [ ] Monitor tab shows audit trail
- [ ] CLI works: `python gui/cli.py --help`
- [ ] Help menus work

#### Issue Reporting
If any issues found:
```bash
# Create issue with label "regression"
gh issue create --title "Release v2.1.0 regression" --label regression

# Or fix and create hotfix branch
git checkout -b hotfix/v2.1.1
```

### Announcement (Within 24 hours)

#### Update Documentation
- [ ] Update main README.md with latest version
- [ ] Update installation guide with download links
- [ ] Update QUICKSTART.md if needed
- [ ] Update enterprise documentation if needed

#### Announcements
- [ ] Create GitHub release discussion/announcement
- [ ] Update project website (if applicable)
- [ ] Post on social media:
  - [ ] Twitter
  - [ ] Discord (if applicable)
  - [ ] Farcaster (if applicable)
- [ ] Email announcement (if applicable)

#### Example Announcement
```
🎉 POIDH Autonomous Bot v2.1.0 Released!

New Features:
- ✨ Cross-platform installers (Windows, macOS, Linux)
- 🚀 Automated CI/CD builds
- 📦 Multiple Linux distribution formats
- 📚 Comprehensive packaging guide

Download:
- Windows: https://github.com/drdeeks/poidh/releases/download/v2.1.0/POIDH-Bot-Setup-v2.1.0-x64.exe
- macOS: https://github.com/drdeeks/poidh/releases/download/v2.1.0/POIDH-Bot-v2.1.0-macos.dmg
- Linux: https://github.com/drdeeks/poidh/releases

Documentation: https://github.com/drdeeks/poidh/blob/main/PACKAGING.md
```

## Post-Release (1-2 weeks)

### Monitor Issues
- [ ] Check GitHub issues for bugs
- [ ] Monitor release discussion
- [ ] Collect user feedback
- [ ] Track download counts

### Hotfix Preparation
If critical bugs found:
```bash
# Create hotfix branch
git checkout main
git pull origin main
git checkout -b hotfix/v2.1.1

# Make fixes
# Commit
git add -A
git commit -m "fix: critical bug in v2.1.0"

# Follow release process for v2.1.1
```

### Next Release Planning
- [ ] Start 2.2.0 planning
- [ ] Create 2.2.0 milestone
- [ ] Label issues for next release
- [ ] Schedule next release date

## Rollback Procedure (If Critical Issue)

```bash
# If release has critical bug preventing use:

# Remove release tag
git tag -d v2.1.0
git push origin --delete v2.1.0

# Delete release on GitHub (web UI)

# Or if already tested and user-facing, create hotfix instead:
git checkout main
git checkout -b hotfix/v2.1.0-hotfix1
# Fix issue
git commit -m "fix: critical issue in v2.1.0"
git tag -a v2.1.1 -m "Hotfix for v2.1.0"
git push origin v2.1.1
```

## Automation Notes

### GitHub Actions Workflow
The `.github/workflows/release-builds.yml` workflow:
- Triggers on tag push (`v*`)
- Builds on:
  - macOS (latest)
  - Ubuntu (latest)
  - Windows (latest)
- Creates installers automatically
- Uploads to GitHub Releases
- Generates release notes

### Typical Timeline
1. Tag push: `git push origin v2.1.0`
2. GitHub Actions triggers (30 seconds)
3. Each platform builds (5-15 minutes):
   - macOS: ~8 min
   - Linux: ~10 min
   - Windows: ~12 min
4. Release created with all artifacts (2 minutes)
5. Total time: ~20-25 minutes

## Version Numbers

### Semantic Versioning
```
MAJOR.MINOR.PATCH
  ↑      ↑      ↑
  │      │      └─ Bug fixes
  │      └────────── New features (backward compatible)
  └─────────────────┤ Breaking changes
```

Examples:
- v1.0.0 → v1.0.1: Bug fix
- v1.0.1 → v1.1.0: New feature
- v1.1.0 → v2.0.0: Breaking change

## Cleanup

After release is stable (1 week):
```bash
# Delete standalone-packaging branch (if not needed)
git push origin --delete standalone-packaging

# Delete local branch
git branch -d standalone-packaging
```

## Emergency Contacts

If release has critical issues:
- [ ] Create GitHub issue
- [ ] Add `urgent` label
- [ ] Notify team via Slack/Discord
- [ ] Consider hotfix release

## Sign-Off

- [ ] **Release Manager**: _________________ Date: _______
- [ ] **QA Lead**: _________________ Date: _______
- [ ] **Security Review**: _________________ Date: _______

---

**Last Updated**: 2024-02-08
**Next Release Target**: [TBD]
**Release Manager**: DrDeek
