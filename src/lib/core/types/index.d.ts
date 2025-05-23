export type OperationQuery =
| string
| {
    [key: string]: undefined | string | string[] | OperationQuery | OperationQuery[] | boolean;
  };
