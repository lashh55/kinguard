import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  forceVisible?: boolean;
};

export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ className = "input-large", forceVisible, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const visible = forceVisible || show;
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={`${className} pr-12`}
          {...props}
        />
        {!forceVisible && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            tabIndex={-1}
          >
            {show ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
          </button>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
