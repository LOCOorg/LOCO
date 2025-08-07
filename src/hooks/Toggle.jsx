// src/components/common/Toggle.jsx
import { Switch } from '@headlessui/react';

const Toggle = ({ checked, onChange, label }) => (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
        <span className="font-medium">{label}</span>

        {/* Headless UI Switch → 접근성·포커스 상태 자동 처리 */}
        <Switch
            checked={checked}
            onChange={onChange}
            className={`${
                checked ? 'bg-blue-600' : 'bg-gray-300'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none`}
        >
      <span
          className={`${
              checked ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
        </Switch>
    </label>
);

export default Toggle;
