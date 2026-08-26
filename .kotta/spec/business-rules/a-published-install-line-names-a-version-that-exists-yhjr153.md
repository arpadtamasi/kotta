---
id: BR-01m0zx29x1nvccpr4xwyhjr153
form: business-rule
title: "A published install line names a version that exists"
---

## Rule

Every surface Kotta publishes that tells a reader how to obtain it names one version: the one the package declares at that commit. The generated rules file, the README and the site say the same number, and nothing states a version by hand where the package already declares it. A release is not finished when the tag is pushed; it is finished when the version those surfaces name resolves on the registry.

## Rationale

The install line is the one instruction whose entire purpose is to get the tool into someone's hands, and it is the only instruction a reader cannot work around by understanding the tool better. Measured on 2026-08-26: the README told readers to install 0.9.0, which was tagged but never published and answers 404; the site told them 0.7.0; the generated rules file, which Kotta writes into every project it touches, said 0.10.0. Three surfaces, three numbers, two of them wrong, and the one a project's agents actually read pointing at something that did not exist. Each was true when it was written, which is exactly why a hand-maintained version is not a fact but a decaying copy.

## Scope

Every published surface that names a version to install: the generated rules file, the repository README, the site. Not the changelog, whose whole subject is versions past. Not a dependency range, which is a constraint rather than an instruction. It does not make Kotta publish anything, and it does not decide when to release; it says that where a version is advertised, it is the one the package declares, and that the release ends at the registry rather than at the tag.
