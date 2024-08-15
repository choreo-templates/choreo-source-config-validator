const core = require("@actions/core");
const fs = require("fs");
const yaml = require("js-yaml");
const { componentYamlSchema } = require("./schemas");

// sanitizeSrcRootPath - remove trailing slash from the path
function sanitizeSrcRootPath(path) {
  if (path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

function readComponentYaml(filePath) {
  try {
    fullPath = `${filePath}/.choreo/component.yaml`;
    let fileContent = fs.readFileSync(fullPath, "utf8");
    return fileContent;
  } catch (error) {
    console.log(
      "No component.yaml found, hence skipping the validation: ",
      error.message
    );
    core.setOutput(
      "No component.yaml found",
      "No component.yaml found, hence skipping the validation"
    );
    // null is used to indicate that the file is not found
    return null;
  }
}

function constructValidationErrorMessage(errors) {
  let errorMessage = "Failed to validate component.yaml";
  if (errors.length == 0) {
    return errorMessage;
  }
  const errorList =
    errors.length === 1 ? errors[0] : errors.map((e) => `\n- ${e}`).join("");
  return `${errorMessage}: ${errorList}`;
}

// Main code
let sourceRootDir = "";
try {
  sourceRootDir = core.getInput("source-root-dir-path");
} catch (error) {
  console.log("Failed to read input: ", error.message);
  core.setFailed("Failed to read input", error.message);
}

try {
  const sanitizedPath = sanitizeSrcRootPath(sourceRootDir);
  fileContent = readComponentYaml(sanitizedPath);
  if (fileContent !== null) {
    // Parse the yaml content
    componentYamlFile = yaml.load(fileContent);
    componentYamlSchema(sanitizedPath)
      .validate(componentYamlFile, { abortEarly: false })
      .then(() => {
        core.setOutput("Component.yaml validation", "Successful");
      })
      .catch((err) => {
        console.log(constructValidationErrorMessage(err.errors));
        core.setFailed("Component.yaml validation failed", err.errors);
      });
  }
} catch (error) {
  console.log("Failed to validate component.yaml: ", error.message);
  core.setFailed("Failed to validate component.yaml", error.message);
}
