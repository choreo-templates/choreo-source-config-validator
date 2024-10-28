/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 808:
/***/ ((module) => {

const sourceConfigFileTypes = {
  COMPONENT_YAML: "component.yaml",
  COMPONENT_CONFIG_YAML: "component-config.yaml",
  ENDPOINT_YAML: "endpoints.yaml",
};

const errCodes = {
  USER_ERROR: "USER ERROR",
  INTERNAL_ERROR: "INTERNAL ERROR",
};

module.exports = {
  sourceConfigFileTypes,
  errCodes,
};


/***/ }),

/***/ 534:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const yup = __nccwpck_require__(295);
const github = __nccwpck_require__(194);
const fs = __nccwpck_require__(147);
const path = __nccwpck_require__(17);

// constants
const ALLOWED_COMPONENT_YAML_VERSIONS = [1.0, 1.1];
const ALLOWED_TYPES = ["REST", "GraphQL", "GRPC", "TCP", "UDP", "WS"];
const ALLOWED_NETWORK_VISIBILITIES = ["Public", "Project", "Organization"];
const BASE_PATH_REQUIRED_TYPES = ["REST", "GraphQL", "WS"];
const COMPONENT_CONFIG_YAML_API_VERSION = ["core.choreo.dev/v1beta1"];
const COMPONENT_CONFIG_YAML_KIND = ["ComponentConfig"];
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
        isUnique || new yup.ValidationError("Endpoint names must be unique")
      );
    },
  });
});

// contextRequired - Custom validation method to check context is required for REST, GraphQL, and WS endpoints
yup.addMethod(yup.string, "contextRequired", function () {
  return this.test({
    name: "context-required",
    test: (value, testCtx) => {
      const { type } = testCtx.parent;
      if (BASE_PATH_REQUIRED_TYPES.includes(type) && !value) {
        return new yup.ValidationError(
          `${testCtx.path} is required for ${type}-type endpoints`
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
      const alphanumericRegex = "[a-zA-Z0-9_-]+";
      const choreoSvcRefNameRegex = new RegExp(
        `^choreo:\/\/\/${alphanumericRegex}\/${alphanumericRegex}\/${alphanumericRegex}\/${alphanumericRegex}\/v\\d+(\\.\\d+)?\/(PUBLIC|PROJECT|ORGANIZATION)$`
      );
      const thirdPartySvcRefNameRegex = new RegExp(
        "^thirdparty:[a-zA-Z0-9._/-]+$"
      );
      const dbSvcRefNameRegex = new RegExp("^database:[a-zA-Z0-9_/-]+$");

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
      return new yup.ValidationError(
        `${testCtx.path} has an invalid service type. It can only contain choreo, thirdparty, or database types.`
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
        /^\/[a-zA-Z0-9\/\-_]*$/,
        ({ path }) =>
          `${path} must start with a forward slash and can only contain alphanumeric characters, hyphens, underscores and forward slashes.`
      ),
    port: yup.number().required().moreThan(1000).lessThan(65535),
  })
  .required()

// endpointSchemaV0D1 - Schema for endpoint definition V0.1
const endpointSchemaV0D1 = (srcDir) =>
  yup.array().of(
    yup.object().shape({
      name: yup.string().required(),
      port: yup.number().required().moreThan(1000).lessThan(65535),
      type: yup.string().required().oneOf(ALLOWED_TYPES),
      networkVisibility: yup.string().oneOf(ALLOWED_NETWORK_VISIBILITIES),
      context: yup
        .string()
        .contextRequired()
        .matches(
          /^\/[a-zA-Z0-9\/\-_]*$/,
          ({ path }) =>
            `${path} must start with a forward slash and can only contain alphanumeric characters, hyphens, and forward slashes.`
        ),
      schemaFilePath: yup.string().schemaFileExists(srcDir),
    })
  );

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
              `${path} must start with a lowercase letter and can only contain lowercase letters, numbers, underscores (_), and hyphens (-).`
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

// specSchema - Schema for spec definition
const specSchema = (srcDir) =>
  yup.object().shape({
    inbound: endpointSchemaV0D1(srcDir).min(0),
    outbound: dependencySchemaV0D1,
  });

// componentYamlSchema - Schema for component.yaml
const componentYamlSchemaV1D0 = (srcDir) =>
  yup.object().shape({
    schemaVersion: yup
      .number()
      .required()
      .oneOf(
        ALLOWED_COMPONENT_YAML_VERSIONS,
        "schemaVersion must be one of the following values: 1.0, 1.1"
      ),
    endpoints: endpointSchemaV0D2(srcDir),
    dependencies: dependencySchemaV0D1,
  });

// endpointYamlSchema - Schema for endpoints.yaml
const endpointYamlSchemaV0D1 = (srcDir) =>
  yup.object().shape({
    version: yup.string().required(),
    endpoints: endpointSchemaV0D1(srcDir).required().min(0),
  });

// componentConfigYamlSchemaV1D0 - Schema for component-config.yaml
const componentConfigYamlSchemaV1beta1 = (srcDir) =>
  yup.object().shape({
    apiVersion: yup
      .string()
      .required()
      .oneOf(COMPONENT_CONFIG_YAML_API_VERSION),
    kind: yup.string().required().equals(COMPONENT_CONFIG_YAML_KIND),
    spec: specSchema(srcDir),
  });

module.exports = {
  componentYamlSchemaV1D0,
  endpointYamlSchemaV0D1,
  componentConfigYamlSchemaV1beta1,
};


/***/ }),

/***/ 556:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 194:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 697:
/***/ ((module) => {

module.exports = eval("require")("js-yaml");


/***/ }),

/***/ 295:
/***/ ((module) => {

module.exports = eval("require")("yup");


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(556);
const fs = __nccwpck_require__(147);
const yaml = __nccwpck_require__(697);
const path = __nccwpck_require__(17);
const {
  componentYamlSchemaV1D0,
  endpointYamlSchemaV0D1,
  componentConfigYamlSchemaV1beta1,
} = __nccwpck_require__(534);
const { sourceConfigFileTypes, errCodes } = __nccwpck_require__(808);

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

async function validateSourceConfigFile(sourceRootDir, fileType) {
  try {
    switch (fileType) {
      case sourceConfigFileTypes.COMPONENT_YAML:
        await componentYamlSchemaV1D0(sourceRootDir).validate(
          srcConfigYamlFile,
          { abortEarly: false }
        );
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

})();

module.exports = __webpack_exports__;
/******/ })()
;