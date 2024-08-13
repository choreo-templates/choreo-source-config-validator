const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
const yaml = require("js-yaml");
const yup = require("yup");

// constants
const ALLOWED_COMPONENT_YAML_VERSIONS = ["0.9", "1.0", "1.1"];
const ALLOWED_TYPES = ["REST", "GraphQL", "GRPC", "TCP", "UDP", "WS"];
const ALLOWED_NETWORK_VISIBILITIES = ["Public", "Private", "Organization"];
const BASE_PATH_REQUIRED_TYPES = ["REST", "GraphQL", "WS"];

// util functions
function readComponentYaml(filePath) {
  try {
    fullPath = `${sourceRootDir}/.choreo/component.yaml`;
    let fileContent = fs.readFileSync(fullPath, "utf8");
    return fileContent;
  } catch (error) {
    console.log(
      "No component.yaml found, hence skipping the validation:",
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

// custom validators
// checkEndpointNameUniqueness - Custom validation method to check if endpoint names are unique
yup.addMethod(yup.array, "checkEndpointNameUniqueness", function () {
  return this.test({
    name: "unique-endpoint-name",
    test: (arr) => {
      const epSet = new Set();
      const isUnique = arr.every((ep) => {
        epName = ep.name;
        if (epSet.has(epName)) {
          return false;
        }
        epSet.add(epName);
        return true;
      });
      return (
        isUnique || new yup.ValidationError("Endpoint names must be unique")
      );
    },
  });
});
// basePathRequired - Custom validation method to check base path is required for REST, GraphQL, and WS endpoints
yup.addMethod(yup.object, "basePathRequired", function () {
  return this.test({
    name: "base-path-required",
    test: (value, testCtx) => {
      const { type } = testCtx.parent;
      if (BASE_PATH_REQUIRED_TYPES.includes(type) && !value.basePath) {
        return new yup.ValidationError(
          "base path is required for REST, GraphQL, and WS endpoints"
        );
      }
      return true;
    },
  });
});

// Schema definitions
// serviceSchema - Schema for service definition
const serviceSchema = yup
  .object()
  .shape({
    basePath: yup.string().matches(/^\/[a-zA-Z0-9\/-]*$/, "Invalid base path"),
    port: yup
      .number()
      .required("Missing port number")
      .moreThan(1000, "Port number must be greater than 1000")
      .lessThan(65535, "Port number must be less than 65535"),
  })
  .required("service definition is required")
  .basePathRequired();
// endpointSchema - Schema for endpoint definition
const endpointSchema = yup
  .array()
  .of(
    yup.object().shape({
      name: yup
        .string()
        .required("Endpoint name is required")
        .max(50, "Endpoint name must be less than 50 characters")
        .matches(
          /^[a-z0-9-]+$/,
          "Endpoint name must only contain lowercase letters, digits, and hyphens"
        ),
      displayName: yup
        .string()
        .required()
        .max(50, "Display name must be less than 50 characters"),
      service: serviceSchema,
      type: yup.string().required("Missing endpoint type").oneOf(ALLOWED_TYPES),
      networkVisibilities: yup
        .array()
        .of(yup.string().oneOf(ALLOWED_NETWORK_VISIBILITIES)),
      schemaFilePath: yup.string(),
    })
  )
  .checkEndpointNameUniqueness();
// componentYamlSchema - Schema for component.yaml
const componentYamlSchema = yup.object().shape({
  schemaVersion: yup.string().required().oneOf(ALLOWED_COMPONENT_YAML_VERSIONS),
  endpoints: endpointSchema,
});

// Main code
let sourceRootDir = "";
try {
  sourceRootDir = core.getInput("source-root-dir");
} catch (error) {
  console.log("Failed to read input:", error.message);
  core.setFailed("Failed to read input", error.message);
}
try {
  fileContent = readComponentYaml(sourceRootDir);
  if (fileContent !== null) {
    // Parse the yaml content
    componentYamlFile = yaml.load(fileContent);
    componentYamlSchema
      .validate(componentYamlFile)
      .then(() => {
        core.setOutput("Component.yaml validation", "Successful");
      })
      .catch((err) => {
        console.log("Component.yaml validation failed:", err.errors);
        core.setFailed("Component.yaml validation failed", err.errors);
      });
  }
} catch (error) {
  console.log("Failed to validate component.yaml:", error.message);
  core.setFailed("Failed to validate component.yaml", error.message);
}
