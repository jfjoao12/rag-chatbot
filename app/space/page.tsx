'use client';

import React, { useEffect, useState } from 'react';
import {
    motion,
    useMotionValue,
    useTransform,
    useSpring,
    MotionValue,
    AnimatePresence
} from 'framer-motion';
import { MoveRight } from 'lucide-react';

// --- Types ---
type Star = {
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    duration: number;
};

type ShootingStarType = {
    id: number;
    x: number;
    y: number;
    angle: number;
};

// --- Helpers ---
const generateStars = (count: number): Star[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        duration: Math.random() * 3 + 2,
    }));
};

const TEXT_PHRASES = [
    "Explore the Unknown",
    "Touch the Stars",
    "Journey Beyond",
    "Infinity Awaits"
];

export default function SpaceLanding() {
    const [mounted, setMounted] = useState(false);

    // Mouse Physics
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { damping: 20, stiffness: 300, mass: 0.5 });
    const smoothY = useSpring(mouseY, { damping: 20, stiffness: 300, mass: 0.5 });

    // Visual State
    const [starsBack, setStarsBack] = useState<Star[]>([]);
    const [starsMid, setStarsMid] = useState<Star[]>([]);
    const [starsFront, setStarsFront] = useState<Star[]>([]);
    const [shootingStar, setShootingStar] = useState<ShootingStarType | null>(null);

    useEffect(() => {
        setStarsBack(generateStars(60));
        setStarsMid(generateStars(30));
        setStarsFront(generateStars(20));
        setMounted(true);

        // Shooting Star Loop
        const triggerShootingStar = () => {
            const newStar = {
                id: Date.now(),
                x: Math.random() * 100,
                y: Math.random() * 60,
                angle: Math.random() * 30 + 135,
            };
            setShootingStar(newStar);

            const nextDelay = Math.random() * 5000 + 3000;
            setTimeout(triggerShootingStar, nextDelay);
        };
        const timer = setTimeout(triggerShootingStar, 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        mouseX.set((clientX / innerWidth) * 2 - 1);
        mouseY.set((clientY / innerHeight) * 2 - 1);
    };

    // Parallax + slight offset
    const xBack = useTransform(smoothX, [-1, 1], [-20, 20]);
    const yBack = useTransform(smoothY, [-1, 1], [-20, 20]);
    const xMid = useTransform(smoothX, [-1, 1], [-40, 40]);
    const yMid = useTransform(smoothY, [-1, 1], [-40, 40]);
    const xFront = useTransform(smoothX, [-1, 1], [-70, 70]);
    const yFront = useTransform(smoothY, [-1, 1], [-70, 70]);

    return (
        <main
            onMouseMove={handleMouseMove}
            className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black text-white"
        >
            {/* 1. Background & Nebulas */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950 via-gray-950 to-black" />
            <NebulaLayer />

            {/* 2. Shooting Stars */}
            <AnimatePresence>
                {shootingStar && (
                    <ShootingStar
                        key={shootingStar.id}
                        data={shootingStar}
                        onComplete={() => setShootingStar(null)}
                    />
                )}
            </AnimatePresence>

            {/* 3. Rotating Star Field Container */}
            {/* We wrap the parallax stars in a container that slowly rotates 360 degrees */}
            <motion.div
                className="absolute inset-[-50%] z-10" // Make it larger than screen so rotation doesn't show edges
                animate={{ rotate: 360 }}
                transition={{ duration: 600, repeat: Infinity, ease: "linear" }}
            >
                {mounted && (
                    <>
                        <motion.div style={{ x: xBack, y: yBack }} className="absolute inset-0">
                            {starsBack.map((star) => <StarNode key={star.id} star={star} />)}
                        </motion.div>
                        <motion.div style={{ x: xMid, y: yMid }} className="absolute inset-0">
                            {starsMid.map((star) => <StarNode key={star.id} star={star} className="shadow-[0_0_4px_white]" />)}
                        </motion.div>
                        <motion.div style={{ x: xFront, y: yFront }} className="absolute inset-0">
                            {starsFront.map((star) => <StarNode key={star.id} star={{ ...star, size: star.size + 1 }} className="shadow-[0_0_8px_white]" />)}
                        </motion.div>
                    </>
                )}
            </motion.div>

            {/* 4. Center Interactive System */}
            <div className="relative z-50 flex flex-col items-center gap-12">
                <div className="relative">
                    {/* The Orbiting Moon System */}
                    <OrbitingMoon />

                    {/* The Sun Button */}
                    <SunButton mouseX={smoothX} mouseY={smoothY} />
                </div>

                {/* Dynamic Text */}
                <div className="h-8"> {/* Fixed height to prevent layout shift */}
                    <CyclingText />
                </div>
            </div>

            {/* Vignette */}
            <div className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(transparent_0%,_black_100%)] opacity-80" />
        </main>
    );
}

// --- Components ---

const NebulaLayer = () => (
    <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
        <motion.div
            className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-indigo-600 blur-[120px] mix-blend-screen"
            animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
            className="absolute top-[40%] -right-[10%] h-[500px] w-[500px] rounded-full bg-teal-800 blur-[100px] mix-blend-screen"
            animate={{ x: [0, -30, 0], y: [0, 50, 0], scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
    </div>
);

const ShootingStar = ({ data, onComplete }: { data: ShootingStarType, onComplete: () => void }) => (
    <motion.div
        className="absolute z-0 h-[2px] w-[100px] bg-gradient-to-r from-transparent via-white to-transparent"
        style={{ left: `${data.x}%`, top: `${data.y}%` }}
        initial={{ opacity: 0, scale: 0.5, rotate: data.angle, x: 0, y: 0 }}
        animate={{ opacity: [0, 1, 0], x: 300, y: 300 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        onAnimationComplete={onComplete}
    />
);

const StarNode = ({ star, className = '' }: { star: Star; className?: string }) => (
    <motion.div
        className={`absolute rounded-full bg-white ${className}`}
        style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size }}
        animate={{ opacity: [star.opacity, 1, star.opacity] }}
        transition={{ duration: star.duration, repeat: Infinity, ease: 'easeInOut' }}
    />
);

// New Component: An object orbiting the center
const OrbitingMoon = () => (
    <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 pointer-events-none"
        style={{ width: 280, height: 280 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
        {/* The Moon Object */}
        <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-blue-200 shadow-[0_0_10px_currentColor]"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
        />
        {/* A tiny satellite orbiting the moon (Orbit-ception) */}
        <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16"
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        >
            <div className="absolute top-0 left-1/2 h-1 w-1 bg-white rounded-full" />
        </motion.div>
    </motion.div>
);

// New Component: Text that changes automatically
const CyclingText = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % TEXT_PHRASES.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-64 text-center">
            <AnimatePresence mode='wait'>
                <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 font-light tracking-[0.4em] text-indigo-200/80 uppercase text-xs"
                >
                    {TEXT_PHRASES[index]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
};

const SunButton = ({ mouseX, mouseY }: { mouseX: MotionValue; mouseY: MotionValue }) => {
    const distance = useTransform(() => {
        const x = mouseX.get();
        const y = mouseY.get();
        return Math.sqrt(x * x + y * y);
    });

    const physicsScale = useTransform(distance, [0, 0.4], [1.3, 1]);
    const scale = useSpring(physicsScale, { damping: 20, stiffness: 200 });

    const glowBlur = useTransform(distance, [0, 0.4], [50, 10]);
    const glowOpacity = useTransform(distance, [0, 0.5], [0.8, 0]);
    const ringScale = useTransform(distance, [0, 0.4], [1.1, 0.85]);
    const ringOpacity = useTransform(distance, [0.1, 0.5], [1, 0]);

    return (
        <motion.button
            style={{ scale }}
            whileTap={{ scale: 0.9 }}
            className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-white outline-none ring-0"
        >
            {/* Ambient Pulse */}
            <motion.div
                className="absolute inset-0 rounded-full bg-indigo-500 blur-2xl opacity-20"
                animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Interactive Glow */}
            <motion.div
                className="absolute inset-0 rounded-full bg-indigo-500"
                style={{ opacity: glowOpacity, filter: useTransform(glowBlur, (v) => `blur(${v}px)`) }}
            />

            <motion.div
                className="absolute inset-0 rounded-full bg-blue-300 blur-md"
                style={{ opacity: useTransform(distance, [0, 0.3], [1, 0.5]) }}
            />

            <motion.div
                className="relative z-10 flex h-full w-full items-center justify-center rounded-full shadow-inner bg-white"
            >
                <motion.div style={{ opacity: useTransform(distance, [0.15, 0.3], [1, 0]) }}>
                    <MoveRight className="h-6 w-6 text-indigo-950" />
                </motion.div>
            </motion.div>

            <motion.div
                className="absolute -inset-2 rounded-full border border-white/40"
                style={{ scale: ringScale, opacity: ringOpacity }}
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
        </motion.button>
    );
};