export type { CaptureAnchorInput, CreateAnchorInput, FindElementOptions } from './capture';
export { captureAnchor, createAnchor, findElementAtPoint } from './capture';
export { restoreAnchor } from './restore';
export { buildSelector, isGeneratedId } from './selector';
export { getElementText } from './text';
export type {
  HiddenReason,
  LocationContext,
  MissingReason,
  PinAnchor,
  PinPosition,
  RestorableAnchor,
  RestoreResult,
  TextCheck,
} from './types';
