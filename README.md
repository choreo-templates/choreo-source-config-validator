# Choreo Source Configuration File Validator

This action validates the source configuration files of Choreo.

## Inputs

### `source-root-dir`

**Required** The path to the root directory of the source code.

## Outputs

### `validation-result`

The result of the validation

## Example usage

```yaml
build:
  steps:
    - name: Choreo Source Configuration Validator
      uses: choreo-templates/choreo-source-config-validator@v0.1.0
      with:
        source-root-dir-path: ${{source-root-dir-path}}
```
