import { Result } from './klip-function';

interface IHandleByKlipStatus {
  /**
   * The result object from the request
   */
  result: Result;
  onComplete?: (result: Result) => Promise<void> | void;
  onError?: (result: Result) => Promise<void> | void;
  onCancel?: (result: Result) => Promise<void> | void;

  /**
   * Action to be performed post any of the routine end actions are done.
   */
  postAction?: () => Promise<void> | void;
}

const handleByKlipStatus = async <T>(options: IHandleByKlipStatus) => {
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

export { handleByKlipStatus };