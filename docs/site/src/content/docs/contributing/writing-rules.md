---
title: Writing rules
description: The ASD-STE100 Simplified Technical English rules that this documentation follows, and the part of them that the linter checks.
---

The text of this site follows ASD-STE100 Simplified Technical English, Issue 9
(15 January 2025). The standard has 53 writing rules and a dictionary of
approximately 900 approved words. Each approved word has one meaning and one
part of speech. The standard is available from
[asd-ste100.org](https://asd-ste100.org/).

## The rules that this site applies

| Rule | Application |
| --- | --- |
| Use an approved word, a Technical Name or a Technical Verb | The list below holds the technical terms of this project. |
| One word has one meaning and one part of speech | "compile" is a verb. For the noun, write "the compilation" or "the compiler". |
| A descriptive sentence has 25 words or less | The linter counts the words. |
| A procedural sentence has 20 words or less | A step of a procedure is one instruction. |
| Write one instruction in one sentence | Steps are a numbered list. |
| Use the active voice in a procedure | Write "the compiler writes the file". Do not write "the file is written". |
| Use a simple tense | Use the present, the past or the future. Do not use a compound tense. |
| Keep the article | Write "set the flag". Do not write "set flag". |
| Do not use a gerund as a noun | Write "the compilation of the file". Do not write "compiling the file". |
| Use the same word for the same thing | Write "target language" each time. Do not write "backend" or "platform". |
| A paragraph has one topic | A procedural paragraph has 6 sentences or less. |
| Put a warning before the step | This applies to a command line option that deletes data. |
| Do not use slang, jargon or promotional wording | See the list below. |

## Technical Names and Technical Verbs

These terms are correct in this documentation. Add a new term to the list in
the pull request that introduces it.

**Names:** Ranger, compiler, operator, template, target, target language, type,
optional, class, record, function, lambda, block, statement, expression,
argument, parameter, array, hash, buffer, string, integer, node, playground,
repository, release, flag, annotation, plugin, polyfill, process, module,
package, source file, output file.

**Verbs:** compile, parse, generate, write, read, install, run, build, publish,
deploy, cache.

## Wording that this site does not use

The documentation gives technical information. It does not sell the language.
The linter rejects these words:

```text
powerful, blazing, seamless, effortless, elegant, beautiful, amazing, awesome,
incredible, revolutionary, cutting-edge, state-of-the-art, first-class,
world-class, robust, lightning-fast, magic, delightful, simply
```

The linter also rejects a contraction ("does not", not "doesn't") and a term
that has an approved equivalent ("target language", not "backend").

## The linter

```sh
npm run docs:lint
```

The command runs [Vale](https://vale.sh/) with the style in
`docs/style/vale/`. The rules are in these files:

| File | Check |
| --- | --- |
| `SentenceLength.yml` | 25 words or less in a sentence |
| `Passive.yml` | The passive voice |
| `Gerund.yml` | A sentence that starts with an `-ing` word |
| `Marketing.yml` | The promotional words |
| `Contractions.yml` | A contraction |
| `Terms.yml` | A term with an approved equivalent |

## The limit of the linter

The complete approved-word check needs the ASD-STE100 dictionary. The
repository must not hold a copy of that dictionary, so the linter checks the
mechanical rules only. A reviewer checks the vocabulary with the dictionary,
which is free of charge from the ASD-STE100 site.

The linter does not run on generated code, on an operator name or on a compiler
message. Those are technical text, and the standard permits them.
