# Dart / Flutter package example

This example shows the intended Dart target workflow:

1. Write shared models and logic in Ranger (no Flutter widgets).
2. Compile to a normal Dart package (`pubspec.yaml` + `.dart` sources).
3. Import that package from a handwritten Flutter UI.

## Compile

```bash
RANGER_LIB="./compiler/Lang.rgr;./lib/stdops.rgr" \
  node bin/output.js examples/dart_flutter_logic/CounterLogic.rgr \
    -l=dart \
    -pubspec \
    -name=counter_logic \
    -version=0.1.0 \
    -description="Shared counter logic from Ranger" \
    -d=examples/dart_flutter_logic/generated \
    -o=counter_logic.dart
```

Add `-flutter` when the package should declare a Flutter SDK dependency.

## Run

```bash
dart run examples/dart_flutter_logic/generated/counter_logic.dart
```

## Flutter usage

In a Flutter app `pubspec.yaml`:

```yaml
dependencies:
  counter_logic:
    path: path/to/examples/dart_flutter_logic/generated
```

Then import and call the generated classes from Dart/Flutter UI code.
