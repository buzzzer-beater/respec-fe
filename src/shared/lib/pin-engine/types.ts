/**
 * 백엔드 `LocationContext`와 같은 모양입니다. 필드는 모두 선택이고, 빈 문자열은 보내지 않습니다.
 * 백엔드가 `extra="forbid"`이므로 여기에 없는 필드를 추가하면 422가 납니다.
 */
export type LocationContext = {
  /** 찾은 요소가 맞는지 검증할 텍스트 (공백 정리, 길이 제한) */
  element_text?: string;
  /** 가장 가까운 `<section>`의 id 또는 첫 제목 텍스트 */
  section_name?: string;
  /** 같은 selector에 잡히는 요소 중 몇 번째인지 (0부터) */
  index?: number;
  /** 핀을 찍을 때의 화면 너비 (정수) */
  viewport_width?: number;
  /** 핀을 찍은 지점의 문서 기준 좌표. 요소를 못 찾았을 때 대신 쓸 위치 */
  page_x?: number;
  page_y?: number;
};

/** 백엔드 `POST /pins`의 위치 필드와 같은 모양입니다. */
export type PinAnchor = {
  /** `/`로 시작하는 페이지 경로 */
  page_path: string;
  element_selector: string;
  /** 요소 안 상대 위치 0~1 */
  relative_x: number;
  relative_y: number;
  location_context?: LocationContext;
};

/** 복원에 필요한 값입니다. 백엔드 응답의 `location_context`는 `null`일 수 있습니다. */
export type RestorableAnchor = Pick<PinAnchor, 'element_selector' | 'relative_x' | 'relative_y'> & {
  location_context?: { [K in keyof LocationContext]?: LocationContext[K] | null } | null;
};

/** `element_text` 비교 결과. 저장된 텍스트가 없으면 `skipped`입니다. */
export type TextCheck = 'match' | 'mismatch' | 'skipped';

export type HiddenReason = 'display-none' | 'visibility-hidden' | 'opacity-zero' | 'zero-size';

export type MissingReason = 'no-match' | 'invalid-selector';

/** 복원한 핀의 위치. client는 문서 viewport 기준, page는 문서 기준 좌표입니다. */
export type PinPosition = {
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
};

export type RestoreResult =
  | {
      status: 'found';
      element: Element;
      textCheck: TextCheck;
      position: PinPosition;
    }
  | {
      /** DOM에는 있지만 지금 보이지 않음 (모달, 탭 등). `needs_check`로 보고하지 않습니다. */
      status: 'hidden';
      element: Element;
      textCheck: TextCheck;
      reason: HiddenReason;
    }
  | {
      /** DOM에 요소가 없음. `needs_check`로 보고할 대상입니다. */
      status: 'missing';
      reason: MissingReason;
      /** 저장된 `page_x/page_y`가 있으면 대신 표시할 문서 좌표 */
      fallback?: { pageX: number; pageY: number };
    };
