"use client";
import Image from "next/image";
import { useState } from "react";

interface AvatarProps {
  nome: string;
  avatar: string;
  foto?: string;
  cor: string;
  size?: number;
  rounded?: string;
}

export default function Avatar({ nome, avatar, foto, cor, size = 36, rounded = "rounded-full" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (foto && !imgError) {
    return (
      <div
        className={`${rounded} overflow-hidden flex-shrink-0`}
        style={{ width: size, height: size, minWidth: size }}
      >
        <Image
          src={foto}
          alt={nome}
          width={size}
          height={size}
          className="w-full h-full object-cover object-top"
          unoptimized
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  return (
    <div
      className={`${rounded} flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: cor,
        fontSize: size * 0.32,
      }}
    >
      {avatar}
    </div>
  );
}
