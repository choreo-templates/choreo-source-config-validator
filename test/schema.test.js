const { endpointYamlSchemaV0D1 } = require("../schemas.js");
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

const testSrcDir = "test/";

async function validateEndpointsSchema(yamlContent) {
  return await endpointYamlSchemaV0D1(testSrcDir).validate(
    yaml.load(yamlContent),
    {
      abortEarly: false,
    }
  );
}
async function expectValidationErrors(yamlContent, expectedErrors) {
  try {
    await validateEndpointsSchema(yamlContent);
    throw new Error("Validation should have failed but did not.");
  } catch (error) {
    expect(error.errors ?? null).toEqual(expectedErrors);
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
      missingRequiredFieldsEndpointsYaml,
      expectedErrors
    );
  });

  test("should fail when port is less than 1000 or greater than 65535", async () => {
    const expectedErrors = [
      "endpoints[0].port must be greater than 1000",
      "endpoints[1].port must be less than 65535",
    ];
    await expectValidationErrors(invalidPortEndpointsYaml, expectedErrors);
  });

  test("should fail when type is not one of REST, GraphQL, GRPC, UDP, TCP, WS", async () => {
    const expectedErrors = [
      "endpoints[6].type must be one of the following values: REST, GraphQL, GRPC, TCP, UDP, WS",
    ];
    await expectValidationErrors(validateTypeFieldYaml, expectedErrors);
  });

  test("should fail when network visibility is not one of Project, Organization, Public ", async () => {
    const expectedErrors = [
      "endpoints[3].networkVisibility must be one of the following values: Public, Project, Organization",
    ];
    await expectValidationErrors(validateVisibilityFieldYaml, expectedErrors);
  });

  test(`should fail when context doesn't start with a forward slash and can only 
    contain alphanumeric characters, hyphens, and forward slashes`, async () => {
    const expectedErrors = [
      "endpoints[1].context must start with a forward slash and can only contain alphanumeric characters, hyphens, and forward slashes.",
      "endpoints[3].context must start with a forward slash and can only contain alphanumeric characters, hyphens, and forward slashes.",
    ];
    await expectValidationErrors(validateContextFieldYaml, expectedErrors);
  });

  test("should fail when context is not provided for endpoint types REST, GraphQl, WS", () => {
    // have a chat about this with nisrin
    // about file path to
    const expectedErrors = [
      "endpoints[0].context is required for REST-type endpoints",
      "endpoints[1].context is required for GraphQL-type endpoints",
      "endpoints[2].context is required for WS-type endpoints",
    ];
    expectValidationErrors(
      validateContextRequiredScenariosYaml,
      expectedErrors
    );
  });

  test("should fail when schema file does not exist in the give path", () => {
    const expectedErrors = [
      "Schema file does not exist at the given path invalid-path.yaml",
    ];
    expectValidationErrors(validateSchemaFilePathYaml, expectedErrors);
  });
});
