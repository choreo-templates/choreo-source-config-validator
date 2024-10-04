const validEndpointsYaml = `version: 0.1
endpoints:
- name: Greeting Service
  port: 9090
  type: REST
  networkVisibility: Project
  context: /greeting
  schemaFilePath: dummy-openapi.yaml`;

const missingRequiredFieldsEndpointsYaml = `
endpoints:
- networkVisibility: Project
  context: /greeting
  schemaFilePath: dummy-openapi.yaml`;

const invalidPortEndpointsYaml = `version: 0.5
endpoints:
- name: Greeting Service
  port: 909
  type: REST
  context: /greeting
- name: Greeting Service2
  port: 90900
  type: REST
  context: /greeting`;

const validateTypeFieldYaml = `version: 0.1
endpoints:
  - name: Greeting Service
    port: 9090
    type: REST
    context: /greeting
  - name: Greeting Service2
    port: 9090
    type: GraphQL
    context: /greeting
  - name: Greeting Service2
    port: 9090
    type: GRPC
    context: /greeting
  - name: Greeting Service2
    port: 9090
    type: UDP
    context: /greeting
  - name: Greeting Service2
    port: 9090
    type: TCP
    context: /greeting
  - name: Greeting Service2
    port: 9090
    type: WS
    context: /greeting
  - name: Greeting Service2
    port: 9090
    type: Wss
    context: /greeting`;

const validateVisibilityFieldYaml = `version: beta
endpoints:
  - name: Greeting Service
    port: 9090
    type: REST
    networkVisibility: Public
    context: /greeting
  - name: Greeting Service2
    port: 9090
    type: GraphQL
    networkVisibility: Project
    context: /greeting
  - name: Greeting Service2
    port: 9090
    type: GRPC
    networkVisibility: Organization
    context: /greeting
  - name: Greeting Service2
    port: 9090
    type: UDP
    networkVisibility: Private
    context: /greeting`;

const validateContextFieldYaml = `version: beta
endpoints:
  - name: Greeting Service
    port: 9090
    type: REST
    networkVisibility: Public
    context: /a-valid-path-123/to-resource
  - name: Greeting Service2
    port: 9090
    type: GraphQL
    networkVisibility: Project
    context: invalid/path/without/leading-slash
  - name: Greeting Service3
    port: 9090
    type: GRPC
    networkVisibility: Organization
    context: /another-valid/path-456
  - name: Greeting Service4
    port: 9090
    type: UDP
    networkVisibility: Public
    context: /invalid_path_with_special&chars`;

const validateContextRequiredScenariosYaml = `version: beta
endpoints:
  - name: Greeting Service
    port: 9090
    type: REST
  - name: Greeting Service2
    port: 9090
    type: GraphQL
  - name: Greeting Service3
    port: 9090
    type: WS
  - name: Greeting Service4
    port: 9090
    type: UDP
  - name: Greeting Service4
    port: 9090
    type: TCP
  - name: Greeting Service4
    port: 9090
    type: GRPC`;

const validateSchemaFilePathYaml = `version: 0.1
endpoints:
  - name: Greeting Service
    port: 9090
    type: REST
    context: /greeting
    schemaFilePath: dummy-openapi.yaml
  - name: Greeting Service2
    port: 9090
    type: GraphQL
    context: /greeting
    schemaFilePath: invalid-path.yaml`;

module.exports = {
  validEndpointsYaml,
  missingRequiredFieldsEndpointsYaml,
  invalidPortEndpointsYaml,
  validateTypeFieldYaml,
  validateVisibilityFieldYaml,
  validateContextFieldYaml,
  validateContextRequiredScenariosYaml,
  validateSchemaFilePathYaml
};
