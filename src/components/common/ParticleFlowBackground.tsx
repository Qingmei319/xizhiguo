/**
 * @file ParticleFlowBackground.tsx
 * @description 粒子流背景组件。基于 Three.js + @react-three/fiber 实现，
 *              在工作台页的背景层渲染三层流动粒子场、三条波动光带和一片星尘，
 *              营造数据流动和科技感的视觉氛围。
 *
 * 组件层级：
 * - StarField：静态星尘粒子层（340 个微小光点）
 * - FlowField：动态粒子流层（三组不同速度/颜色/宽度的流动粒子）
 * - FlowRibbon：动态光带层（三条正弦波曲线，模拟数据流线）
 *
 * 整体使用 AdditiveBlending（加法混合）和 memo 防止不必要的重渲染。
 */
import { Canvas, useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Line,
  LineBasicMaterial,
  type Points,
} from 'three';

/** 粒子流背景组件的 Props */
type ParticleFlowBackgroundProps = {
  /** 附加到根容器的 CSS 类名，可选 */
  className?: string;
};

/** 粒子流场组件的 Props */
type FlowFieldProps = {
  /** 粒子数量 */
  count: number;
  /** 粒子流纵向偏移位置（Y 轴基线） */
  laneOffset: number;
  /** 粒子颜色 */
  color: string;
  /** 流动速度倍率 */
  speed: number;
  /** 粒子纵向散布范围 */
  spread: number;
};

/**
 * 粒子流场组件
 *
 * 在指定 Y 轴基线上生成一组水平流动的粒子，每帧通过正弦函数驱动 Y/Z 方向的波动，
 * 模拟数据流在水平方向匀速前进、纵向随波飘动的效果。
 *
 * @param props - 流场参数（粒子数量、基线、颜色、速度、散布）
 */
function FlowField({ count, laneOffset, color, speed, spread }: FlowFieldProps) {
  const pointsRef = useRef<Points>(null);
  // 初始化粒子位置和随机相位，只在 count/laneOffset/spread 变化时重新计算
  const basePositions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const progress = i / Math.max(count - 1, 1);
      // X 轴：粒子均匀分布在 [-8, 8] 的水平范围
      const x = progress * 16 - 8;
      // Y 轴：基线 + 随机偏移（散布宽度由 spread 控制）
      const drift = (Math.random() - 0.5) * spread;
      // Z 轴：随机深度，营造前后层次感
      const z = -1.8 + Math.random() * 2.2;

      positions[i * 3] = x;
      positions[i * 3 + 1] = laneOffset + drift;
      positions[i * 3 + 2] = z;
      // 每个粒子的随机初始相位，避免所有粒子同步运动
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, phases };
  }, [count, laneOffset, spread]);

  // 每帧更新粒子 Y/Z 坐标，实现波动动画
  useFrame(({ clock }) => {
    const geometry = pointsRef.current?.geometry;
    const position = geometry?.getAttribute('position') as BufferAttribute | undefined;
    if (!position) return;

    // 用时钟累计时间 × 速度倍率作为动画时间因子
    const elapsed = clock.elapsedTime * speed;
    const array = position.array as Float32Array;

    for (let i = 0; i < count; i += 1) {
      const x = basePositions.positions[i * 3];
      const phase = basePositions.phases[i];
      // Y 轴：基线位置 + 两组不同频率的正弦波动叠加
      array[i * 3 + 1] =
        basePositions.positions[i * 3 + 1] +
        Math.sin(x * 1.1 + elapsed + phase) * 0.34 +
        Math.sin(x * 0.42 - elapsed * 0.74 + phase) * 0.22;
      // Z 轴：基线深度 + 低频余弦波动，模拟前后飘动
      array[i * 3 + 2] = basePositions.positions[i * 3 + 2] + Math.cos(elapsed * 0.7 + phase) * 0.24;
    }

    position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[basePositions.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={new Color(color)}
        size={0.038}
        sizeAttenuation
        transparent
        opacity={0.78}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

/** 流动光带组件的 Props */
type RibbonProps = {
  /** 光带 Y 轴基线位置 */
  y: number;
  /** 光带颜色 */
  color: string;
  /** 波动速度倍率 */
  speed: number;
  /** 波动振幅 */
  amplitude: number;
};

/**
 * 流动光带组件
 *
 * 在指定 Y 轴基线上渲染一条正弦波动的细线（光带），
 * 每帧通过两组不同频率的三角函数驱动纵向波动，
 * 模拟数据流线的流动感。使用 AdditiveBlending 产生发光叠加效果。
 *
 * @param props - 光带参数（基线、颜色、速度、振幅）
 */
function FlowRibbon({ y, color, speed, amplitude }: RibbonProps) {
  // 光带由 180 个段组成，足够平滑
  const segments = 180;
  // 初始化光带的几何体和材质，只在颜色和基线变化时重建
  const ribbon = useMemo(() => {
    const positions = new Float32Array(segments * 3);
    for (let i = 0; i < segments; i += 1) {
      const progress = i / (segments - 1);
      const x = progress * 16 - 8;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      // Z 轴：两端接近中线，中间微微浮起，营造弧形深度感
      positions[i * 3 + 2] = -1.6 + Math.sin(progress * Math.PI) * 0.34;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));

    const material = new LineBasicMaterial({
      color: new Color(color),
      transparent: true,
      opacity: 0.44,
      blending: AdditiveBlending,
    });

    return new Line(geometry, material);
  }, [color, y]);

  // 每帧更新光带 Y 坐标，实现波动动画
  useFrame(({ clock }) => {
    const position = ribbon.geometry.getAttribute('position') as BufferAttribute | undefined;
    if (!position) return;

    const elapsed = clock.elapsedTime * speed;
    const array = position.array as Float32Array;

    for (let i = 0; i < segments; i += 1) {
      const progress = i / (segments - 1);
      const x = progress * 16 - 8;
      // Y 轴：基线 + 两组不同频率的三角函数波动叠加
      array[i * 3 + 1] =
        y +
        Math.sin(x * 0.76 + elapsed) * amplitude +
        Math.cos(x * 1.18 - elapsed * 0.66) * (amplitude * 0.52);
    }

    position.needsUpdate = true;
  });

  return <primitive object={ribbon} />;
}

/**
 * 星尘粒子层组件
 *
 * 在场景深处随机分布 340 个微小光点，模拟星空背景。
 * 使用静态数据（不每帧更新），仅作为背景装饰层。
 */
function StarField() {
  // 初始化星尘粒子位置，固定不变（不需要动画）
  const particles = useMemo(() => {
    const count = 340;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      // X/Y：随机分布在整个可视范围
      positions[i * 3] = Math.random() * 16 - 8;
      positions[i * 3 + 1] = Math.random() * 8 - 2;
      // Z：固定在场景深处，不遮挡前景粒子
      positions[i * 3 + 2] = -2.6 - Math.random() * 1.8;
    }

    return positions;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#2cb8ff"
        size={0.024}
        sizeAttenuation
        transparent
        opacity={0.62}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

/**
 * 粒子流背景组件（主入口）
 *
 * 组合三层视觉效果：
 * 1. StarField：静态星尘背景
 * 2. FlowField × 3：三组不同参数的粒子流（底层慢蓝 → 中层快蓝 → 上层浅蓝）
 * 3. FlowRibbon × 3：三条波动光带（增强流动感）
 *
 * 使用 React.memo 防止父组件状态变化时重渲染。
 * Canvas 配置了 alpha 透明背景和高性能渲染偏好。
 *
 * @param props - 仅包含可选的 className
 */
export const ParticleFlowBackground = memo(function ParticleFlowBackground({ className }: ParticleFlowBackgroundProps) {
  return (
    <div className={className ? `particle-flow-background ${className}` : 'particle-flow-background'} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.55, 7.2], fov: 58 }}
        dpr={[1, 1.7]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.4} />
        {/* 静态星尘背景层 */}
        <StarField />
        {/* 三组粒子流：底层（深蓝慢速宽散布）→ 中层 → 上层（浅蓝慢速窄散布） */}
        <FlowField count={460} laneOffset={-1.76} color="#108dff" speed={0.92} spread={0.42} />
        <FlowField count={380} laneOffset={-0.92} color="#36d9ff" speed={0.72} spread={0.36} />
        <FlowField count={260} laneOffset={0.08} color="#1f8bff" speed={0.58} spread={0.24} />
        {/* 三条光带：纵向分布在粒子流之间，增强视觉引导感 */}
        <FlowRibbon y={-1.86} color="#1f8bff" speed={0.88} amplitude={0.42} />
        <FlowRibbon y={-1.28} color="#36d9ff" speed={0.72} amplitude={0.32} />
        <FlowRibbon y={-0.42} color="#2f73ff" speed={0.54} amplitude={0.24} />
      </Canvas>
    </div>
  );
});
