import { forwardRef } from 'react';
import TipTapAdvancedEditor from './TipTapAdvancedEditor';

const NovelEditor = forwardRef((props, ref) => {
    // TipTapAdvancedEditor로 모든 props 전달
    return <TipTapAdvancedEditor {...props} ref={ref} />;
});

NovelEditor.displayName = 'NovelEditor';

export default NovelEditor;