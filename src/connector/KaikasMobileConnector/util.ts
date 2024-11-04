import { IGetResultCommon } from './type';

interface IHandleByKlipStatus<T> {
  /**
   * The result object from the request
   */
  result: IGetResultCommon<T>;
  onComplete?: (result: IGetResultCommon<T>) => Promise<void> | void;
  onError?: (result: IGetResultCommon<T>) => Promise<void> | void;
  onCancel?: (result: IGetResultCommon<T>) => Promise<void> | void;

  /**
   * Action to be performed post any of the routine end actions are done.
   */
  postAction?: () => Promise<void> | void;
}

const handleByKlutchStatus = async <T>(options: IHandleByKlipStatus<T>) => {
  const { result, onComplete, onError, onCancel, postAction } = options;

  // Run the action by the result status
  if (result.status === 'completed') {
    await onComplete?.(result);
    await postAction?.();
  } else if (result.status === 'error') {
    await onError?.(result);
    await postAction?.();
  } else if (result.status === 'canceled') {
    await onCancel?.(result);
    await postAction?.();
  }
};

export { handleByKlutchStatus };
