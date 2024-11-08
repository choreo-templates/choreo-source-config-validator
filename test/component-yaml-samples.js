const validComponentYaml = `schemaVersion: 1.0
endpoints:
  - name: greeter-sample
    displayName: Go Greeter Sample
    service:
      basePath: /greeting-service
      port: 9090
    type: REST
    networkVisibilities: 
      - Public
      - Organization
    schemaFilePath: dummy-openapi.yaml
dependencies:
    serviceReferences:
      - name: choreo:///apifirst/mttm/mmvhxd/ad088/v1.0/PUBLIC
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - from: ServiceURL
            to: SERVICE_URL`;

const missingRequiredFieldsComponentYaml = `
endpoints:
  - displayName: Go Greeter Sample`;

const validateEndpointName = `schemaVersion: 1.0
endpoints:
  - name: greeter-sample
    displayName: Go Greeter Sample
    service:
      basePath: /greeting-service
      port: 9090
    type: UDP
  - name: valid-string-123
    displayName: Go Greeter Sample
    service:
      basePath: /greeting-service
      port: 9090
    type: UDP
  - name: InvalidString
    displayName: Go Greeter Sample
    service:
      basePath: /greeting-service
      port: 9090
    type: UDP
  - name: 1invalid-start
    displayName: Go Greeter Sample
    service:
      basePath: /greeting-service
      port: 9090
    type: UDP
  - name:  greeter-sample
    displayName: Go Greeter Sample
    service:
      basePath: /greeting-service
      port: 9090
    type: UDP
  - name:  a1234567890_valid_string_example_with_numbers_1234567
    displayName: Go Greeter Sample
    service:
      basePath: /greeting-service
      port: 9090
    type: UDP`;

const validateEndpointDisplayName = `schemaVersion: 1.0
endpoints:
    - name: greeter-sample
      displayName: This string contains spaces, 123, symbols!@#
      service:
        basePath: /greeting-service
        port: 9090
      type: UDP
    - name: greeter-sample2
      displayName: short_string_with_symbols!@#$%^&*()_+{}|:"<>?
      service:
        basePath: /greeting-service
        port: 9090
      type: UDP
    - name: greeter-sample3
      displayName: This string is way too long because it has more than fifty characters in total.
      service:
        basePath: /greeting-service
        port: 9090
      type: UDP`;
const validateServiceSchema = `schemaVersion: 1.0
endpoints:
    - name: greeter-sample
      displayName: greeter sample
      service:
        basePath: /a-valid-path-123/to-resource
        port: 909
      type: UDP
    - name: greeter-sample2
      displayName: greeter sample
      service:
        basePath:  invalid/path/without/leading-slash
        port: 75000
      type: UDP
    - name: greeter-sample3
      displayName: greeter sample
      service:
        basePath:  /invalid_path_with_special&chars
        port: 9090
      type: UDP`;

const validateTypeField = `schemaVersion: 1.0
endpoints:
    - name: greeter-sample
      service:
        port: 9090
      type: GRPC
    - name: greeter-sample2
      service:
        port: 9090
        basePath:  /ctx
      type: WS
    - name: greeter-sample3
      service:
        port: 9090
        basePath:  /ctx
      type: REST
    - name: greeter-sample4
      service:
        port: 9090
        basePath:  /ctx
      type: GraphQL
    - name: greeter-sample5
      service:
        port: 9090
      type: TCP
    - name: greeter-sample6
      service:
        port: 9090
      type: UDP
    - name: greeter-sample7
      service:
        port: 9090
      type: pdf`;

const validateNetworkVisibilityField = `schemaVersion: 1.0
endpoints:
    - name: greeter-sample
      service:
        port: 9090
      type: GRPC
      networkVisibilities: 
        - Public
    - name: greeter-sample2
      service:
        port: 9090
        basePath:  /ctx
      type: WS
      networkVisibilities: 
        - Organization
    - name: greeter-sample3
      service:
        port: 9090
        basePath:  /ctx
      type: REST
      networkVisibilities: 
        - Project
    - name: greeter-sample4
      service:
        port: 9090
        basePath:  /ctx
      type: GraphQL
      networkVisibilities: 
        - Public
        - Organization
    - name: greeter-sample5
      service:
        port: 9090
      type: TCP
      networkVisibilities: 
        - Project
        - Organization
    - name: greeter-sample6
      service:
        port: 9090
      type: UDP
      networkVisibilities: 
        - Public
        - Project
    - name: greeter-sample7
      service:
        port: 9090
      type: UDP
      networkVisibilities: 
        - Public
        - Organization
        - Project
    - name: greeter-sample8
      service:
        port: 9090
      type: UDP
      networkVisibilities: 
        - Public
        - Private`;

const validateSchemaFilePath = `schemaVersion: 1.0
endpoints:
  - name: greeter-sample
    displayName: Go Greeter Sample
    service:
      basePath: /greeting-service
      port: 9090
    type: REST
    schemaFilePath: dummy-openapi.yaml
  - name: greeter-sample2
    displayName: Go Greeter Sample
    service:
      basePath: /greeting-service
      port: 9090
    type: REST
    schemaFilePath: wrong-openapi.yaml`;

const validateServiceReferenceName = `schemaVersion: 1.0
dependencies:
    serviceReferences:
    #0
      - name: choreo:///apifirst/mttm/mmvhxd/ad088/v1.0/PUBLIC
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - from: ServiceURL
            to: SERVICE_URL
    #1
      - name: choreo:///user123/project456/service789/instance000/v2.3/PROJECT
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - from: ServiceURL
            to: SERVICE_URL
    #2
      - name: choreo:///service_name/project_name/component_name/instance_name/v1/PRIVATE
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - from: ServiceURL
            to: SERVICE_URL
    #3
      - name: choreo://service_name/project_name/component_name/instance_name/v1/PUBLIC
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - from: ServiceURL
            to: SERVICE_URL

    #4: check for valid tp name here:
      - name: thirdparty:service name_test-v1.1/v1.1
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - from: ServiceURL
            to: SERVICE_URL
    #5
      - name: thirdparty:some-service_v1.0/path/to/resource
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - from: ServiceURL
            to: SERVICE_URL
    #6
      - name: thirdparty:service*name
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - from: ServiceURL
            to: SERVICE_URL

    #7: check for valid db name here:
      - name: database:my_database-1/service-123
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - from: ServiceURL
            to: SERVICE_URL
    #8
      - name: database:service*name
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - from: ServiceURL
            to: SERVICE_URL
    #9
      - name: database:my_database.com/service-123/instance_1
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - from: ServiceURL
            to: SERVICE_URL`;

const validateServiceReferenceConnectionConfig = `schemaVersion: 1.0
dependencies:
    serviceReferences:
      - name: choreo:///apifirst/mttm/mmvhxd/ad088/v1.0/PUBLIC
        env:
          - from: ServiceURL
            to: SERVICE_URL
      - name: choreo:///apifirst/mttm/mmvhxd/ad088/v1.0/PUBLIC
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412s
        env:
          - from: ServiceURL
            to: SERVICE_URL
      - name: choreo:///apifirst/mttm/mmvhxd/ad088/v1.0/PUBLIC
        connectionConfig: not uuid
        env:
          - from: ServiceURL
            to: SERVICE_URL`;

const validateServiceReferenceEnv = `schemaVersion: 1.0
dependencies:
    serviceReferences:
      - name: choreo:///apifirst/mttm/mmvhxd/ad088/v1.0/PUBLIC
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
      - name: choreo:///apifirst/mttm/mmvhxd/ad088/v1.0/PUBLIC
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - from: ServiceURL
      - name: choreo:///apifirst/mttm/mmvhxd/ad088/v1.0/PUBLIC
        connectionConfig: 19d2648b-d29c-4452-afdd-1b9311e81412
        env:
          - to: SERVICE_URL`;

const validateConnectionReferenceName = `schemaVersion: 1.1
dependencies:
    connectionReferences:
      - name:
        resourceRef: service:/mttm/mmvhxd/v1.1/ad088/PUBLIC
      - name: valid_connection_name
        resourceRef: service:/mttm/mmvhxd/v1.1/ad088/PUBLIC
      - name: invalid__connection_name
        resourceRef: service:/mttm/mmvhxd/v1.1/ad088/PUBLIC
      - name: valid connection name-v1.1
        resourceRef: service:/mttm/mmvhxd/v1.1/ad088/PUBLIC
      - name: invalid connection name-v1.1.
        resourceRef: service:/mttm/mmvhxd/v1.1/ad088/PUBLIC
      - name: Valid Connection Name 
        resourceRef: service:/mttm/mmvhxd/v1.1/ad088/PUBLIC
      - name: Invalid Connection Name_ 
        resourceRef: service:/mttm/mmvhxd/v1.1/ad088/PUBLIC`

const validateConnectionReferenceResourceRef = `schemaVersion: 1.1
dependencies:
    connectionReferences:
      - name: valid_connection_name1
        resourceRef: 
      - name: valid_connection_name0
        resourceRef: service:/mttm/mmvhxd/v1.1/ad088/PUBLIC 
      - name: valid_connection_name1
        resourceRef: service:mttm/mmvhxd/v1.1/ad088/PUBLIC
      - name: valid_connection_name1
        resourceRef: service:/mttm/mmvhxd/v1.1/ad088/PRIVATE
      - name: valid_connection_name0
        resourceRef: /mttm/mmvhxd/v1.1/ad088/PUBLIC
      - name: valid_connection_name1
        resourceRef: mttm/mmvhxd/v1.1/ad088/PUBLIC
      - name: valid_connection_name0
        resourceRef: mmvhxd/v1.1/ad088/PUBLIC
      - name: valid_connection_name0
        resourceRef: mmvhxd/v1.1/PUBLIC
      - name: valid_connection_name0
        resourceRef: mmvhxd/v1.1/ad088
      - name: valid_connection_name1
        resourceRef: mmvhxd/v1.1/ad088/
      - name: valid_connection_name0
        resourceRef: mmvhxd/v1.1
      - name: valid_connection_name1
        resourceRef: mmvhxd/v1.1/
      - name: valid_connection_name0
        resourceRef: /mmtm/mmvhxd/v1.1
      - name: valid_connection_name0 
        resourceRef: thirdparty:mttm/v1.1
      - name: valid_connection_name1
        resourceRef: thirdparty:mttm/v1.1/invalid
      - name: valid_connection_name1
        resourceRef: thirdparty:v1.1
      - name: valid_connection_name1
        resourceRef: thirdparty:mmtm/
      - name: valid_connection_name0
        resourceRef: database:mySqlDbServer/hotelDb
      - name: valid_connection_name1
        resourceRef: database:mySqlDbServerV1.1/hotelDb
      - name: valid_connection_name1
        resourceRef: database:mySqlDbServer/hotelDb/invalid
      - name: valid_connection_name1
        resourceRef: database:/mySqlDbServer/hotelDb
      - name: valid_connection_name1
        resourceRef: THIRDPARTY:mySqlDbServer/hotelDb/invalid`

module.exports = {
  validComponentYaml,
  missingRequiredFieldsComponentYaml,
  validateEndpointName,
  validateEndpointDisplayName,
  validateServiceSchema,
  validateTypeField,
  validateNetworkVisibilityField,
  validateSchemaFilePath,
  validateServiceReferenceName,
  validateServiceReferenceConnectionConfig,
  validateServiceReferenceEnv,
  validateConnectionReferenceName,
  validateConnectionReferenceResourceRef,
};
