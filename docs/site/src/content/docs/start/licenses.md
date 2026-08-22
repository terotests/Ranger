---
title: Licenses
description: The MIT license of the compiler and the AGPL of the gallery directory.
---

The repository has two licenses. The path of a file selects the license.

## The compiler and the language

Ranger-authored files outside `gallery/` use the MIT license, unless a
file or a directory states a different license.

The MIT license lets you compile a program that you write. You can sell that
program. You can keep the source of that program closed.

The compiler does not put the AGPL on a program because it compiled that
program.

## The gallery directory

Ranger-authored files under `gallery/` use the GNU Affero General Public
License. The version is 3 or a later version, unless a file or a
directory states a different license.

The gallery directory holds the application stack of Ranger:

- EVG
- the Office readers and editors
- the DataGrid
- the PDF and layout tools
- the other large applications

A program that imports a gallery module uses that module. The AGPL then
applies to that program.

## The direction of a dependency

A gallery module can import a file from `lib/` or from `compiler/`.

A file in `lib/` or in `compiler/` must not import a gallery module.

## Third-party files

Some files in `gallery/` keep the license of their authors. Each of those
files has its own license file next to it. The gallery AGPL does not
change the license of those files.

## Related pages

- [LICENSE](https://github.com/terotests/Ranger/blob/master/LICENSE) in the repository
- [LICENSE-MIT](https://github.com/terotests/Ranger/blob/master/LICENSE-MIT)
- [LICENSE-AGPL-3.0](https://github.com/terotests/Ranger/blob/master/LICENSE-AGPL-3.0)
- [gallery/LICENSE](https://github.com/terotests/Ranger/blob/master/gallery/LICENSE)
- [LICENSING.md](https://github.com/terotests/Ranger/blob/master/LICENSING.md)
