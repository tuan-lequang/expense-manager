export default function Cat({
  className = '',
  sleeping = false,
}: {
  className?: string;
  sleeping?: boolean;
}) {
  return (
    <svg className={`cat ${className}`} viewBox="0 0 300 280" fill="none" aria-hidden="true">
      <ellipse cx="152" cy="254" rx="95" ry="12" fill="#55634a" opacity=".08" />
      <path
        d="M222 224c37 14 53-14 38-27-10-9-22 2-15 9"
        stroke="#d6c3a4"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <path
        d="M83 193c-5 30-9 59 20 59h90c26 0 28-35 14-62"
        fill="#f4e7cf"
        stroke="#594d40"
        strokeWidth="3"
      />
      <path
        d="M88 105 69 34c-2-8 3-13 12-9l66 38m55 42 25-71c3-8-2-12-11-8l-62 39"
        fill="#fff5e3"
        stroke="#594d40"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="m83 42 11 43 28-14m89-29-15 43-28-14" fill="#eac3b1" />
      <path
        d="M64 142c0-53 37-85 85-85s86 32 86 85c0 43-34 73-86 73s-85-30-85-73Z"
        fill="#fff5e3"
        stroke="#594d40"
        strokeWidth="3"
      />
      <path
        d="m133 61 5 17m13-20v18m16-15-5 17"
        stroke="#d9c7a6"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {sleeping ? (
        <path d="m101 138 19 6m57 0 19-6" stroke="#594d40" strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path
          d="M103 140q9-13 18 0m56 0q9-13 18 0"
          stroke="#594d40"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
      <path d="m142 151 7 5 7-5" fill="#ba8e79" />
      <path
        d="M149 157c0 11-13 12-15 4m15-4c0 11 13 12 15 4"
        stroke="#594d40"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="99" cy="158" rx="15" ry="8" fill="#eac3b1" opacity=".8" />
      <ellipse cx="199" cy="158" rx="15" ry="8" fill="#eac3b1" opacity=".8" />
      <path
        d="m72 148-22-4m24 16-20 5m169-17 22-4m-24 16 20 5"
        stroke="#94806a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M107 210v33m82-33v33" stroke="#d6c3a4" strokeWidth="3" strokeLinecap="round" />
      <path d="M110 190q39 19 78 0" stroke="#8aab8c" strokeWidth="10" strokeLinecap="round" />
      <circle cx="150" cy="204" r="9" fill="#ddba68" />
      <path d="M150 201v6" stroke="#967842" strokeWidth="2" strokeLinecap="round" />
      <path
        d="m37 96 3-9 3 9 9 3-9 3-3 9-3-9-9-3 9-3Zm205 44 3-8 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"
        fill="#9cad8e"
      />
      <path d="M246 69c-10-14-23 0-11 9l11 8 11-8c12-9-1-23-11-9Z" fill="#d5b6cb" />
    </svg>
  );
}
