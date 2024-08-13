const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
const yaml = require("js-yaml");

// constants
const ALLOWED_COMPONENT_YAML_VERSIONS = ["0.9", "1.0", "1.1"];
const ALLOWED_TYPES = ["REST", "GraphQL", "GRPC", "TCP", "UDP"];
const ALLOWED_NETWORK_VISIBILITIES = ["Public", "Private", "Organization"];

// util functions
function readComponentYaml(filePath) {
  try {
    fullPath = `${sourceRootDir}/.choreo/component.yaml`;
    let fileContent = fs.readFileSync(fullPath, "utf8");
    return fileContent;
  } catch (error) {
    console.log("Failed to read component.yaml", error.message);
    core.setOutput(
      "No component.yaml found",
      "No component.yaml found, hence skipping the validation"
    );
    // null is used to indicate that the file is not found
    return null;
  }
}

// validation schemas
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
// schemaPathRequired - Custom validation method to check when type is REST, schemaFilePath is required
yup.addMethod(yup.string, "schemaPathRequired", function () {
  return this.test({
    name: "schema-path-required",
    test: (value, testCtx) => {
      const { type } = testCtx.parent;
      if (type == "REST" && !value) {
        return new yup.ValidationError(
          "Schema file path is required for REST endpoints"
        );
      }
      return true;
    },
  });
});
// serviceSchema - Schema for service definition
const serviceSchema = yup
  .object()
  .shape({
    basePath: yup
      .string()
      .required("Missing base path")
      .matches(/^\/[a-zA-Z0-9\/-]*$/, "Invalid base path"),
    port: yup
      .number()
      .required("Missing port number")
      .moreThan(1000, "Port number must be greater than 1000"),
  })
  .required("Missing service definition");
// endpointSchema - Schema for endpoint definition
const endpointSchema = yup
  .array()
  .of(
    yup.object().shape({
      name: yup
        .string()
        .required("Endpoint name is required")
        .matches(
          /^[a-z0-9-]+$/,
          "Endpoint name must only contain lowercase letters, digits, and hyphens"
        ),
      displayName: yup.string().optional(),
      service: serviceSchema,
      type: yup.string().required("Missing endpoint type").oneOf(ALLOWED_TYPES),
      networkVisibilities: yup
        .array()
        .of(yup.string().oneOf(ALLOWED_NETWORK_VISIBILITIES)),
      schemaFilePath: yup.string().schemaPathRequired(),
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
        core.setFailed("Component.yaml validation failed", err.errors);
      });
  }
} catch (error) {
  core.setFailed("Failed to validate component.yaml", error.message);
}
