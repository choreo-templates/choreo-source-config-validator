# Choreo Source Configuration File Validator

This action validates the source configuration files of Choreo.

## Inputs

### `source-root-dir`

**Required** The path to the root directory of the source code.

### `file-type`

**Required** The type of the source configuration file. Possible values are `component.yaml`, `component-config.yaml` and `endpoints.yaml`

## Outputs

### `validation-result`

The result of the validation

## Example usage

```yaml
build:
  steps:
    - name: Choreo Source Configuration Validator
      uses: choreo-templates/choreo-source-config-validator@v1.0.0
      with:
        source-root-dir-path: ${{source-root-dir-path}}
        file-type:  ${{file-type}}
```
