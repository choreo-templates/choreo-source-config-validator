const {
  endpointYamlSchemaV0D1,
  componentYamlSchemaV1D0,
  componentConfigYamlSchemaV1beta1,
} = require("../schemas.js");
const yaml = require("js-yaml");
const {
  validEndpointsYaml,
  missingRequiredFieldsEndpointsYaml,
  invalidPortEndpointsYaml,
  validateTypeFieldYaml,
  validateVisibilityFieldYaml,
  validateContextFieldYaml,
  validateContextRequiredScenariosYaml,
  validateSchemaFilePathYaml,
} = require("./endpoints-yaml-samples.js");
const {
  validComponentYaml,
  missingRequiredFieldsComponentYaml,
  validateEndpointName,
  validateEndpointDisplayName,
  validateServiceSchema,
  validateBasePathRequired,
  validateTypeField,
  validateNetworkVisibilityField,
  validateSchemaFilePath,
  validateServiceReferenceName,
  validateServiceReferenceConnectionConfig,
  validateServiceReferenceEnv,
} = require("./component-yaml-samples.js");

const testSrcDir = "test/";
const COMPONENT_YAML = "component.yaml";
const ENDPOINTS_YAML = "endpoints.yaml";
const COMPONENT_CONFIG_YAML = "component-config.yaml";

async function validateEndpointsSchema(yamlContent) {
  return await endpointYamlSchemaV0D1(testSrcDir).validate(
    yaml.load(yamlContent),
    {
      abortEarly: false,
    }
  );
}
async function validateComponentYamlSchema(yamlContent) {
  return await componentYamlSchemaV1D0(testSrcDir).validate(
    yaml.load(yamlContent),
    {
      abortEarly: false,
    }
  );
}

async function validateComponentConfigSchema(yamlContent) {
  return await componentConfigYamlSchemaV1beta1(testSrcDir).validate(
    yaml.load(yamlContent),
    {
      abortEarly: false,
    }
  );
}
async function expectValidationErrors(yamlType, yamlContent, expectedErrors) {
  try {
    switch (yamlType) {
      case COMPONENT_YAML:
        await validateComponentYamlSchema(yamlContent);
        break;
      case ENDPOINTS_YAML:
        await validateEndpointsSchema(yamlContent);
        break;
      case COMPONENT_CONFIG_YAML:
        await validateComponentConfigSchema(yamlContent);
        break;
      default:
        throw new Error("Invalid yaml type");
    }
    throw new Error("Validation should have failed but did not.");
  } catch (error) {
    if (!error.errors) {
      throw new Error(error.message);
    }
    expect(error.errors).toEqual(expectedErrors);
  }
}

describe("endpointYamlSchemaV0D1 schema tests", () => {
  test("should validate correctly with valid endpoints.yaml", async () => {
    const result = await validateEndpointsSchema(validEndpointsYaml);
    expect(result).toBeDefined();
  });

  test("should fail validation when required fields (version, name, port, type) are missing", async () => {
    const expectedErrors = [
      "version is a required field",
      "endpoints[0].name is a required field",
      "endpoints[0].port is a required field",
      "endpoints[0].type is a required field",
    ];
    await expectValidationErrors(
      ENDPOINTS_YAML,
      missingRequiredFieldsEndpointsYaml,
      expectedErrors
    );
  });

  test("should fail when port is less than 1000 or greater than 65535", async () => {
    const expectedErrors = [
      "endpoints[0].port must be greater than 1000",
      "endpoints[1].port must be less than 65535",
    ];
    await expectValidationErrors(
      ENDPOINTS_YAML,
      invalidPortEndpointsYaml,
      expectedErrors
    );
  });

  test("should fail when type is not one of REST, GraphQL, GRPC, UDP, TCP, WS", async () => {
    const expectedErrors = [
      "endpoints[6].type must be one of the following values: REST, GraphQL, GRPC, TCP, UDP, WS",
    ];
    await expectValidationErrors(
      ENDPOINTS_YAML,
      validateTypeFieldYaml,
      expectedErrors
    );
  });

  test("should fail when network visibility is not one of Project, Organization, Public ", async () => {
    const expectedErrors = [
      "endpoints[3].networkVisibility must be one of the following values: Public, Project, Organization",
    ];
    await expectValidationErrors(
      ENDPOINTS_YAML,
      validateVisibilityFieldYaml,
      expectedErrors
    );
  });

  test(`should fail when context doesn't start with a forward slash and can only 
    contain alphanumeric characters, hyphens, and forward slashes`, async () => {
    const expectedErrors = [
      "endpoints[1].context must start with a forward slash and can only contain alphanumeric characters, hyphens, and forward slashes.",
      "endpoints[3].context must start with a forward slash and can only contain alphanumeric characters, hyphens, and forward slashes.",
    ];
    await expectValidationErrors(
      ENDPOINTS_YAML,
      validateContextFieldYaml,
      expectedErrors
    );
  });

  test("should fail when context is not provided for endpoint types REST, GraphQl, WS", async () => {
    const expectedErrors = [
      "endpoints[0].context is required for REST-type endpoints",
      "endpoints[1].context is required for GraphQL-type endpoints",
      "endpoints[2].context is required for WS-type endpoints",
    ];
    await expectValidationErrors(
      ENDPOINTS_YAML,
      validateContextRequiredScenariosYaml,
      expectedErrors
    );
  });

  test("should fail when schema file does not exist in the give path", async () => {
    const expectedErrors = [
      "Schema file does not exist at the given path invalid-path.yaml.",
    ];
    await expectValidationErrors(
      ENDPOINTS_YAML,
      validateSchemaFilePathYaml,
      expectedErrors
    );
  });
});

describe("componentYamlSchemaV1D0 schema tests", () => {
  test("should validate correctly with valid component.yaml", async () => {
    const result = await validateComponentYamlSchema(validComponentYaml);
    expect(result).toBeDefined();
  });

  test("should fail when required fields (schemaVersion, endpoint name, type and port) are missing", async () => {
    const expectedErrors = [
      "schemaVersion is a required field",
      "endpoints[0].name is a required field",
      "endpoints[0].service.port is a required field",
      "endpoints[0].type is a required field",
    ];
    await expectValidationErrors(
      COMPONENT_YAML,
      missingRequiredFieldsComponentYaml,
      expectedErrors
    );
  });
  test("should fail when endpoint name not valid and unique", async () => {
    const expectedErrors = [
      "endpoints[2].name must start with a lowercase letter and can only contain lowercase letters, numbers, underscores (_), and hyphens (-).",
      "endpoints[3].name must start with a lowercase letter and can only contain lowercase letters, numbers, underscores (_), and hyphens (-).",
      "endpoints[5].name must be at most 50 characters",
      "Endpoint names must be unique",
    ];
    await expectValidationErrors(
      COMPONENT_YAML,
      validateEndpointName,
      expectedErrors
    );
  });
  test("should fail when endpoint display name is not valid", async () => {
    const expectedErrors = [
      "endpoints[2].displayName must be at most 50 characters",
    ];
    await expectValidationErrors(
      COMPONENT_YAML,
      validateEndpointDisplayName,
      expectedErrors
    );
  });
  test("should fail when service schema section is not valid", async () => {
    const expectedErrors = [
      "endpoints[0].service.port must be greater than 1000",
      "endpoints[1].service.basePath must start with a forward slash and can only contain alphanumeric characters, hyphens, underscores and forward slashes.",
      "endpoints[1].service.port must be less than 65535",
      "endpoints[2].service.basePath must start with a forward slash and can only contain alphanumeric characters, hyphens, underscores and forward slashes.",
    ];
    await expectValidationErrors(
      COMPONENT_YAML,
      validateServiceSchema,
      expectedErrors
    );
  });
  test("should fail when base path is not provided for endpoint types REST, GraphQl, WS", async () => {
    const expectedErrors = [
      "endpoints[1].service is required for WS-type endpoints",
      "endpoints[2].service is required for REST-type endpoints",
      "endpoints[3].service is required for GraphQL-type endpoints",
    ];
    await expectValidationErrors(
      COMPONENT_YAML,
      validateBasePathRequired,
      expectedErrors
    );
  });
  test("should fail when type is not one of REST, GraphQL, GRPC, UDP, TCP, WS", async () => {
    const expectedErrors = [
      "endpoints[6].type must be one of the following values: REST, GraphQL, GRPC, TCP, UDP, WS",
    ];
    await expectValidationErrors(
      COMPONENT_YAML,
      validateTypeField,
      expectedErrors
    );
  });
  test("should fail whe network visibilities is not an array containing any combination of Public, Organization, or Project", async () => {
    const expectedErrors = [
      "endpoints[7].networkVisibilities[1] must be one of the following values: Public, Project, Organization",
    ];
    await expectValidationErrors(
      COMPONENT_YAML,
      validateNetworkVisibilityField,
      expectedErrors
    );
  });
  test("should fail when schema file does not exist in the give path", async () => {
    const expectedErrors = [
      "Schema file does not exist at the given path wrong-openapi.yaml.",
    ];
    await expectValidationErrors(
      COMPONENT_YAML,
      validateSchemaFilePath,
      expectedErrors
    );
  });
  test("should fail when service reference name is not valid", async () => {
    const expectedErrors = [
      "dependencies.serviceReferences[2].name must follow the format choreo:///<org-handle>/<project-handle>/<component-handle>/<endpoint-identifier>/<major-version>/<network-visibility>",
      "dependencies.serviceReferences[3].name has an invalid service type. It can only contain choreo, thirdparty, or database types.",
      "dependencies.serviceReferences[6].name has an invalid service identifier, only alphanumeric characters, periods (.), underscores (_), hyphens (-), and slashes (/) are allowed after thirdparty:",
      "dependencies.serviceReferences[8].name has an invalid service identifier, only alphanumeric characters, underscores (_), hyphens (-), and slashes (/) are allowed after database:",
      "dependencies.serviceReferences[9].name has an invalid service identifier, only alphanumeric characters, underscores (_), hyphens (-), and slashes (/) are allowed after database:",
    ];
    await expectValidationErrors(
      COMPONENT_YAML,
      validateServiceReferenceName,
      expectedErrors
    );
  });
  test("should fail when service reference connection config is not valid", async () => {
    const expectedErrors = [
      "dependencies.serviceReferences[0].connectionConfig is a required field",
      "dependencies.serviceReferences[1].connectionConfig must be a valid UUID",
      "dependencies.serviceReferences[2].connectionConfig must be a valid UUID",
    ];
    await expectValidationErrors(
      COMPONENT_YAML,
      validateServiceReferenceConnectionConfig,
      expectedErrors
    );
  });
  test("should fail when service reference env is not valid", async () => {
    const expectedErrors = [
      "dependencies.serviceReferences[0].env is a required field",
      "dependencies.serviceReferences[1].env[0].to is a required field",
      "dependencies.serviceReferences[2].env[0].from is a required field",
    ];
    await expectValidationErrors(
      COMPONENT_YAML,
      validateServiceReferenceEnv,
      expectedErrors
    );
  });
});
