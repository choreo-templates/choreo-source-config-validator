const core = require("@actions/core");
const fs = require("fs");
const yaml = require("js-yaml");
const path = require("path");
const {
  componentYamlSchemaV1D2,
  componentYamlSchemaV1D1,
  componentYamlSchemaV1D0,
  endpointYamlSchemaV0D1,
  componentConfigYamlSchemaV1beta1,
  LATEST_COMPONENT_YAML_SCHEMA_VERSION,
} = require("./schemas");
const { sourceConfigFileTypes, errCodes } = require("./enums");

function showOlderSrcConfigDetectedMessage(fileType, componentYamlVersion) {
  if (
    fileType === sourceConfigFileTypes.COMPONENT_CONFIG_YAML ||
    fileType === sourceConfigFileTypes.ENDPOINT_YAML
  ) {
    core.warning(
      `OUTDATED SOURCE CONFIG: You are using ${fileType}, which is an outdated source configuration file. Update to "component.yaml v${LATEST_COMPONENT_YAML_SCHEMA_VERSION}" to benefit from new features and improvements.`
    );
    return;
  }
  if (fileType === sourceConfigFileTypes.COMPONENT_YAML) {
    parsedComponentYamlVersion = Number(componentYamlVersion);
    if (parsedComponentYamlVersion < LATEST_COMPONENT_YAML_SCHEMA_VERSION) {
      core.warning(
        `OUTDATED SOURCE CONFIG: You are using component.yaml v${parsedComponentYamlVersion}, which is an outdated source configuration file. Update to "component.yaml v${LATEST_COMPONENT_YAML_SCHEMA_VERSION}" to benefit from new features and improvements.`
      );
      return;
    }
  }
}

function readInput() {
  sourceRootDir = core.getInput("source-root-dir-path");
  fileType = core.getInput("file-type");
  return [sourceRootDir, fileType];
}

function readSrcConfigYaml(filePath, fileType) {
  try {
    let fullPath = path.join(filePath, ".choreo");
    if (
      fileType === sourceConfigFileTypes.COMPONENT_YAML ||
      fileType === sourceConfigFileTypes.ENDPOINT_YAML ||
      fileType === sourceConfigFileTypes.COMPONENT_CONFIG_YAML
    ) {
      fullPath = path.join(fullPath, fileType);
    } else {
      throw new Error(`'${fileType}' is not a valid source config file type`);
    }

    let fileContent = fs.readFileSync(fullPath, "utf8");
    return fileContent;
  } catch (error) {
    throw new Error(
      `${errCodes.USER_ERROR} Failed to read source config file: ${error.message}`
    );
  }
}

function parseYaml(fileContent) {
  try {
    return yaml.load(fileContent);
  } catch (error) {
    throw new Error(
      `${errCodes.USER_ERROR} Failed to parse yaml: ${error.message}`
    );
  }
}

function constructValidationErrorMessage(err, fileType) {
  const errors = err.errors;
  if (!errors || errors.length == 0) {
    return (
      `${errCodes.INTERNAL_ERROR} Failed to validate ${fileType}, something went wrong:` +
      err
    );
  }
  const errorMsg = `${errCodes.USER_ERROR} ${fileType} validation failed: `;
  const errorList =
    errors.length === 1 ? errors[0] : errors.map((e) => `\n- ${e}`).join("");
  return errorMsg + errorList;
}

async function validateComponentYaml(sourceRootDir, schemaVersion) {
  parsedSchemaVersion = Number(schemaVersion);
  switch (parsedSchemaVersion) {
    case 1.0:
      await componentYamlSchemaV1D0(sourceRootDir).validate(srcConfigYamlFile, {
        abortEarly: false,
      });
      break;
    case 1.1:
      await componentYamlSchemaV1D1(sourceRootDir).validate(srcConfigYamlFile, {
        abortEarly: false,
      });
      break;
    case 1.2:
      await componentYamlSchemaV1D2(sourceRootDir).validate(srcConfigYamlFile, {
        abortEarly: false,
      });
      break;
    default:
      throw new Error(
        `SchemaVersion must be one of the following values: 1.0, 1.1`
      );
  }
}

async function validateSourceConfigFile(sourceRootDir, fileType) {
  try {
    // Need to show a warning message if the source config file is outdated
    showOlderSrcConfigDetectedMessage(
      fileType,
      srcConfigYamlFile.schemaVersion || null
    );
    switch (fileType) {
      case sourceConfigFileTypes.COMPONENT_YAML:
        const schemaVersion = srcConfigYamlFile.schemaVersion;
        await validateComponentYaml(sourceRootDir, schemaVersion);
        break;
      case sourceConfigFileTypes.COMPONENT_CONFIG_YAML:
        await componentConfigYamlSchemaV1beta1(sourceRootDir).validate(
          srcConfigYamlFile,
          { abortEarly: false }
        );
        break;
      case sourceConfigFileTypes.ENDPOINT_YAML:
        await endpointYamlSchemaV0D1(sourceRootDir).validate(
          srcConfigYamlFile,
          { abortEarly: false }
        );
        break;
      default:
        throw new Error(`'${fileType}' is not a valid source config file type`);
    }
    // Validate the component YAML file
  } catch (err) {
    throw new Error(constructValidationErrorMessage(err, fileType));
  }
}

async function main() {
  try {
    const [sourceRootDir, fileType] = readInput();
    const fileContent = readSrcConfigYaml(sourceRootDir, fileType);
    srcConfigYamlFile = parseYaml(fileContent);
    await validateSourceConfigFile(sourceRootDir, fileType);
  } catch (error) {
    console.log(error.message);
    core.setFailed("Source config file validation failed");
  }
}

// Exec the main function
main();
