const yup = require("yup");
const github = require("@actions/github");
const fs = require("fs");
const path = require("path");

// constants
const ALLOWED_COMPONENT_YAML_VERSIONS = ["0.9", "1.0", "1.1"];
const ALLOWED_TYPES = ["REST", "GraphQL", "GRPC", "TCP", "UDP", "WS"];
const ALLOWED_NETWORK_VISIBILITIES = ["Public", "Project", "Organization"];
const BASE_PATH_REQUIRED_TYPES = ["REST", "GraphQL", "WS"];

// custom validators
// checkEndpointNameUniqueness - Custom validation method to check if endpoint names are unique
yup.addMethod(yup.array, "checkEndpointNameUniqueness", function () {
  return this.test({
    name: "unique-endpoint-name",
    test: (arr) => {
      // the endpoints section is optional, hence return true if it is not present
      if (!arr) {
        return true;
      }
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
        isUnique || new yup.ValidationError("Endpoint names must be unique.")
      );
    },
  });
});

// check to remove this
// basePathRequired - Custom validation method to check base path is required for REST, GraphQL, and WS endpoints
yup.addMethod(yup.object, "basePathRequired", function () {
  return this.test({
    name: "base-path-required",
    test: (value, testCtx) => {
      const { type } = testCtx.parent;
      if (BASE_PATH_REQUIRED_TYPES.includes(type) && !value.basePath) {
        return new yup.ValidationError(
          "Base path is required for REST, GraphQL, and WS endpoints."
        );
      }
      return true;
    },
  });
});

// SchemaFileExists - Custom validation method to check if the provided schema file exists
yup.addMethod(yup.string, "schemaFileExists", function (srcDir) {
  return this.test({
    name: "schema-file-exists",
    test: (value) => {
      // schema file path is optional, hence return true if it is not present
      if (!value) {
        return true;
      }
      schemaFilePath = path.join(srcDir, value);
      try {
        const hasFile = fs.existsSync(schemaFilePath);
        return (
          hasFile ||
          new yup.ValidationError(
            `Schema file does not exist at the given path ${value}.`
          )
        );
      } catch (error) {
        new yup.ValidationError(
          "Failed to check if schema file exists:",
          error.message
        );
      }
    },
  });
});

// validateServiceName - Custom validation method to validate service name
yup.addMethod(yup.string, "validateServiceName", function () {
  return this.test({
    name: "validate-service-name",
    test: (value, testCtx) => {
      const alphanumericRegex = "[a-z0-9_-]+";
      const choreoSvcRefNameRegex = new RegExp(
        `^choreo:\/\/\/${alphanumericRegex}\/${alphanumericRegex}\/${alphanumericRegex}\/${alphanumericRegex}\/v\\d+(\\.\\d+)?\/(PUBLIC|PROJECT|ORGANIZATION)$`
      );
      const thirdPartySvcRefNameRegex = new RegExp(
        "^thirdparty:[a-zA-Z0-9._/-]+$"
      );
      const dbSvcRefNameRegex = new RegExp("^database:[a-z0-9_/-]+$");

      if (value.startsWith("choreo:///")) {
        return (
          choreoSvcRefNameRegex.test(value) ||
          new yup.ValidationError(
            `${testCtx.path} must follow the format ` +
              `choreo:///<org-handle>/<project-handle>/<component-handle>/<endpoint-identifier>/<major-version>/<network-visibility>`
          )
        );
      }
      if (value.startsWith("thirdparty:")) {
        return (
          thirdPartySvcRefNameRegex.test(value) ||
          new yup.ValidationError(
            `${testCtx.path} has an invalid service identifier, ` +
              `only alphanumeric characters, periods (.), underscores (_), hyphens (-), and slashes (/) are allowed after thirdparty:`
          )
        );
      }
      if (value.startsWith("database:")) {
        return (
          dbSvcRefNameRegex.test(value) ||
          new yup.ValidationError(
            `${testCtx.path} has an invalid service identifier, ` +
              `only alphanumeric characters, underscores (_), hyphens (-), and slashes (/) are allowed after database:`
          )
        );
      }
      return (
        thirdPartySvcRefNameRegex.test(value) ||
        dbSvcRefNameRegex.test(value) ||
        new yup.ValidationError(
          `${testCtx.path} has an invalid service type. It can only contain choreo, thirdparty, or database types.`
        )
      );
    },
  });
});

// Schema definitions
// NOTE: specified schema versions are aligned with Rudder component schema versions
// serviceSchema - Schema for service definition
const serviceSchema = yup
  .object()
  .shape({
    basePath: yup
      .string()
      .matches(
        /^\/[a-zA-Z0-9\/-]*$/,
        ({ path }) =>
          `${path} must start with a forward slash and can only contain alphanumeric characters, hyphens, and forward slashes.`
      ),
    port: yup.number().required().moreThan(1000).lessThan(65535),
  })
  .required()
  .basePathRequired();

// endpointSchemaV0D2 - Schema for endpoint definition V0.2
const endpointSchemaV0D2 = (srcDir) =>
  yup
    .array()
    .of(
      yup.object().shape({
        name: yup
          .string()
          .required()
          .max(50)
          .matches(
            /^[a-z][a-z0-9_-]*$/,
            ({ path }) =>
              `${path} must start with a lowercase letter and can contain lowercase letters, numbers, underscores (_), and hyphens (-).`
          ),
        displayName: yup.string().max(50),
        service: serviceSchema,
        type: yup.string().required().oneOf(ALLOWED_TYPES),
        networkVisibilities: yup
          .array()
          .of(yup.string().oneOf(ALLOWED_NETWORK_VISIBILITIES)),
        schemaFilePath: yup.string().schemaFileExists(srcDir),
      })
    )
    .checkEndpointNameUniqueness();

// serviceReferencesSchema - Schema for service references
const serviceReferencesSchema = yup.array().of(
  yup.object().shape({
    name: yup.string().required().validateServiceName(),
    connectionConfig: yup.string().uuid().required(),
    env: yup
      .array()
      .of(
        yup.object().shape({
          from: yup.string().required(),
          to: yup.string().required(),
        })
      )
      .required(),
  })
);

// dependencySchemaV0D1 - Schema for dependency definition V0.1
const dependencySchemaV0D1 = yup.object().shape({
  serviceReferences: serviceReferencesSchema,
});

// componentYamlSchema - Schema for component.yaml
const componentYamlSchemaV1D0 = (srcDir) =>
  yup.object().shape({
    schemaVersion: yup
      .string()
      .required()
      .oneOf(ALLOWED_COMPONENT_YAML_VERSIONS),
    endpoints: endpointSchemaV0D2(srcDir),
    dependencies: dependencySchemaV0D1,
  });

module.exports = {
  componentYamlSchemaV1D0,
};
