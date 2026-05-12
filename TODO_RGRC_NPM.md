# TODO: Ranger Compiler (RGRC) NPM Publishing

> Based on [PLAN_RGRC_NPM.md](PLAN_RGRC_NPM.md)

## Status: 🟡 In Progress

---

## Phase 1: CLI Improvements

### 1.1 Create CLI Progress Module
- [ ] Create `compiler/CLIProgress.rgr`
  - [ ] Add ANSI color operators (reset, bold, green, red, yellow, cyan, gray)
  - [ ] Add Unicode symbol operators (check_mark, cross_mark, arrow_right, spinner_frame)
  - [ ] Implement `CLIProgress` class with methods:
    - [ ] `success(msg)` - Green checkmark message
    - [ ] `error(msg)` - Red cross message
    - [ ] `warning(msg)` - Yellow warning message
    - [ ] `info(msg)` - Cyan info message
    - [ ] `dim(msg)` - Gray dimmed text
    - [ ] `bold(msg)` - Bold text
    - [ ] `step(num, name)` - Step progress `[1/5] Name...`
    - [ ] `header(title, version)` - Compiler header
    - [ ] `divider()` - Horizontal line
    - [ ] `fileInfo(label, path)` - File info display
  - [ ] Add `isTTY()` detection for color support

### 1.2 Update Lang.rgr
- [ ] Add ANSI escape code operators if not using CLIProgress approach
- [ ] Verify existing terminal operators work (`move_cursor`, `clear_screen`, etc.)

### 1.3 Update VirtualCompiler.rgr
- [ ] Import CLIProgress module
- [ ] Replace plain `print` statements with CLI formatted output
- [ ] Update `displayCompilerErrors()` with enhanced formatting:
  - [ ] Show file:line:column location
  - [ ] Display code context (line before, error line, line after)
  - [ ] Add pointer arrow to error position
  - [ ] Color-code error messages
- [ ] Update `displayParserErrors()` similarly
- [ ] Add compilation summary at end:
  - [ ] Success/failure status
  - [ ] Output file path
  - [ ] Target language
  - [ ] Compilation time

### 1.4 Add CLI Flags
- [ ] Add `--no-color` flag to disable colors (for CI)
- [ ] Add `--quiet` flag for minimal output
- [ ] Add `--verbose` flag for detailed output

### 1.5 Testing
- [ ] Test on macOS
- [ ] Test on Linux (Ubuntu)
- [ ] Test on Windows (PowerShell, CMD)
- [ ] Test with `--no-color` in CI environment

---

## Phase 2: GitHub Actions - Auto-Publish

### 2.1 Create NPM Publish Workflow
- [ ] Create `.github/workflows/npm-publish.yml`
  - [ ] Trigger on push to master when `package.json` changes
  - [ ] Add `check-version` job to compare versions
  - [ ] Add `test` job (depends on version change)
  - [ ] Add `publish` job:
    - [ ] Build compiler
    - [ ] Publish to NPM
    - [ ] Create Git tag
    - [ ] Create GitHub Release

### 2.2 Update Existing Workflows
- [ ] Review `.github/workflows/publish.yml`
- [ ] Decide: deprecate or keep as manual trigger
- [ ] Update `.github/workflows/ci.yml` if needed

### 2.3 Test Workflow
- [ ] Test with `act` locally (GitHub Actions local runner)
- [ ] Do a dry-run with `--dry-run` flag
- [ ] Verify version detection logic

---

## Phase 3: NPM Configuration

### 3.1 GitHub Secrets
- [ ] Verify `NPM_TOKEN` secret exists in GitHub repo settings
- [ ] If not, create NPM automation token and add to secrets

### 3.2 Update package.json
- [ ] Add `publishConfig` section:
  ```json
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
  ```
- [ ] Add `files` array to specify included files
- [ ] Add version scripts:
  ```json
  "version:patch": "npm version patch",
  "version:minor": "npm version minor",
  "version:major": "npm version major",
  "version:prerelease": "npm version prerelease --preid=beta"
  ```
- [ ] Add `prepublishOnly` script
- [ ] Update `engines` to specify Node.js version

### 3.3 Create .npmignore
- [ ] Create `.npmignore` file
- [ ] Exclude:
  - [ ] `.github/`
  - [ ] `tests/`
  - [ ] `features/`
  - [ ] `generated/`
  - [ ] `gallery/`
  - [ ] `examples/`
  - [ ] `native/`
  - [ ] `rust_compiler/`
  - [ ] `adventofcode/`
  - [ ] `fiddle/`
  - [ ] Most `.md` files (keep README, CHANGELOG)
  - [ ] Config files (`.gitignore`, `tsconfig.json`, etc.)
  - [ ] Test files (`*_test.js`, `*.test.ts`)

### 3.4 Test Locally
- [ ] Run `npm pack` to create tarball
- [ ] Inspect tarball contents
- [ ] Test local install: `npm install ./ranger-compiler-*.tgz`
- [ ] Verify `rgrc --help` works

---

## Phase 4: Beta Release (3.0.0-beta.1)

### 4.1 Version Bump
- [ ] Update `package.json` version to `3.0.0-beta.1`

### 4.2 Update CHANGELOG.md
- [ ] Add `## [3.0.0-beta.1] - YYYY-MM-DD` section
- [ ] Document new features:
  - [ ] CLI improvements (colors, progress, error formatting)
  - [ ] Automatic NPM publishing
- [ ] Document any breaking changes

### 4.3 Recompile Compiler
- [ ] Run `npm run compile` with new CLI code
- [ ] Verify compiler self-compiles successfully
- [ ] Test new CLI output manually

### 4.4 Final Checks
- [ ] All tests pass: `npm test`
- [ ] Compiler works: `rgrc --help`
- [ ] Sample compilation works

### 4.5 Release
- [ ] Create PR with all changes
- [ ] Review and approve
- [ ] Merge to master
- [ ] Verify GitHub Action triggers
- [ ] Verify NPM publication at https://www.npmjs.com/package/ranger-compiler

### 4.6 Post-Release Verification
- [ ] Install globally: `npm install -g ranger-compiler@3.0.0-beta.1`
- [ ] Test `rgrc --help`
- [ ] Test compilation of sample file
- [ ] Verify GitHub Release was created
- [ ] Verify Git tag was created

---

## Phase 5: ranger-pdf-tool Integration

### 5.1 Create PDF Tool Publish Workflow
- [ ] Create `.github/workflows/npm-publish-pdf-tool.yml`
  - [ ] Trigger on `gallery/pdf_writer/package.json` changes
  - [ ] Build using root npm scripts
  - [ ] Publish from `gallery/pdf_writer/` directory

### 5.2 Update PDF Tool Package
- [ ] Update `gallery/pdf_writer/package.json`:
  - [ ] Set name to `ranger-pdf-tool`
  - [ ] Add `publishConfig`
  - [ ] Add `files` array
  - [ ] Update dependencies

### 5.3 Build Integration
- [ ] Verify `npm run pdf:build` works in CI
- [ ] Test pdf-tool installation locally

### 5.4 Coordinated Release (Optional)
- [ ] Consider monorepo publish workflow
- [ ] Document release coordination process

---

## Files Checklist

### New Files to Create
- [ ] `compiler/CLIProgress.rgr`
- [ ] `.github/workflows/npm-publish.yml`
- [ ] `.github/workflows/npm-publish-pdf-tool.yml`
- [ ] `.npmignore`

### Files to Modify
- [ ] `compiler/VirtualCompiler.rgr` - CLI output
- [ ] `package.json` - publishConfig, scripts
- [ ] `CHANGELOG.md` - Release notes
- [ ] `.github/workflows/publish.yml` - Update/deprecate

---

## Notes

### NPM Token Setup
1. Go to https://www.npmjs.com/ → Access Tokens
2. Generate New Token → Type: Automation
3. Copy token
4. GitHub repo → Settings → Secrets → Actions
5. Add `NPM_TOKEN` with token value

### Testing Auto-Publish
1. Create test branch
2. Bump version in package.json
3. Push and create PR
4. Merge to master
5. Watch Actions tab for workflow execution

### Rollback Plan
If publish fails:
1. Check GitHub Actions logs
2. Fix issue in new PR
3. Bump version again (required for NPM)
4. Re-merge

---

## Timeline

| Phase | Estimated Time | Status |
|-------|---------------|--------|
| Phase 1: CLI Improvements | 8-12 hours | ⬜ Not Started |
| Phase 2: GitHub Actions | 2-4 hours | ⬜ Not Started |
| Phase 3: NPM Configuration | 1-2 hours | ⬜ Not Started |
| Phase 4: Beta Release | 2-4 hours | ⬜ Not Started |
| Phase 5: PDF Tool Setup | 2-4 hours | ⬜ Not Started |

**Total Estimate: 15-26 hours**

---

## References

- [PLAN_RGRC_NPM.md](PLAN_RGRC_NPM.md) - Full plan with code examples
- [PLAN_PDF_NPM.md](PLAN_PDF_NPM.md) - PDF tool package plan
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [package.json](package.json) - Current package configuration
