import * as React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      {...props}
    >
      <path fill="none" d="M0 0h256v256H0z" />
      <path
        fill="currentColor"
        d="M128 24a104 104 0 10104 104A104.1 104.1 0 00128 24zm-48 104a48 48 0 0148-48v96a48 48 0 01-48-48z"
        opacity={0.2}
      />
      <path
        fill="currentColor"
        d="M207.2 56.2a104.5 104.5 0 00-14.8-14.8A104 104 0 0032 128a103.9 103.9 0 0031.4 76.6 104.5 104.5 0 0014.8 14.8 103.9 103.9 0 0076.6 31.4 104.5 104.5 0 0014.8-2.3 104 104 0 0077.5-120.5zM128 176V80a48 48 0 010 96z"
      />
    </svg>
  );
}
