import ReactECharts from 'echarts-for-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  AimOutlined,
  CloudOutlined,
  CompassOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  FieldTimeOutlined,
  FireOutlined,
  LoadingOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Card, Space, Typography } from 'antd';
import { useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Group } from 'three';
import { BufferGeometry, CatmullRomCurve3, Line, LineBasicMaterial, Quaternion, TubeGeometry, Vector3 } from 'three';
import {
  greenhouseFloatingSensors,
  greenhouseMetrics,
  greenhouseTrendLabels,
  greenhouseTrendSeries,
  greenhouseWeatherPanel,
  type GreenhouseIconType,
} from '@/services/mock/greenhouse.mock';
import type { SensorMetric } from '@/types/greenhouse';
import './index.less';

/** 页面文案常量（中文） */
const text = {
  metricsTitle: '\u5b9e\u65f6\u73af\u5883\u4e0e\u57fa\u8d28\u6307\u6807',
  switchSource: '\u5207\u6362\u6570\u636e\u6e90:',
  boardOnline: '\u4e3b\u677f40396623',
  online: '\u5728\u7ebf',
  refresh: '\u5237\u65b0\u6570\u636e',
  syncing: '\u4f20\u611f\u5668\u5b9e\u65f6\u540c\u6b65\u4e2d',
  weatherTitle: '\u7b51\u8c61\u4e0e\u519c\u65f6\u4e2d\u67a2',
  outdoorTemp: '\u5ba4\u5916\u6e29\u5ea6',
  wind: '\u98ce\u529b\u98ce\u5411',
  trendTitle: '24\u5c0f\u65f6\u6e29\u6e7f\u5ea6\u8d8b\u52bf\u56fe',
  tempLegend: '\u6e29\u5ea6\uff08\u2103\uff09',
  humidityLegend: '\u6e7f\u5ea6\uff08%RH\uff09',
  loading: '\u6570\u636e\u52a0\u8f7d\u4e2d...',
  footnote: '\u6570\u636e\u6765\u81ea\u7269\u8054\u7f51\u8bbe\u5907\uff0c\u53ef\u80fd\u5b58\u5728\u5ef6\u8fdf\uff0c\u8bf7\u4ee5\u5b9e\u9645\u4e3a\u51c6\u3002',
  cue: '\u62d6\u52a8\u6216\u6eda\u8f6e\u67e5\u770b\u6e29\u5ba4\u6a21\u578b',
};

/** 温室传感器类型对应的图标映射 —— 内联 SVG 线条风格 */
const greenhouseIconMap: Record<GreenhouseIconType, ReactNode> = {
  light: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M4.93 4.93l2.12 2.12" />
      <path d="M16.95 16.95l2.12 2.12" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="M4.93 19.07l2.12-2.12" />
      <path d="M16.95 7.05l2.12-2.12" />
    </svg>
  ),
  weather: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  pressure: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <path d="M12 22a10 10 0 1 1 0-20" />
      <path d="M12 2v4" />
      <path d="m12 6 9-3-3 9" />
    </svg>
  ),
  humidity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0Z" />
    </svg>
  ),
  co2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  ),
};

/** 指标卡片对应的图标映射 —— 内联 SVG 线条风格 */
const metricIconMap: Record<SensorMetric['type'], ReactNode> = {
  temperature: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
      <line x1="12" y1="4" x2="12" y2="2" />
    </svg>
  ),
  humidity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0Z" />
    </svg>
  ),
  co2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  ),
  light: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M4.93 4.93l2.12 2.12" />
      <path d="M16.95 16.95l2.12 2.12" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="M4.93 19.07l2.12-2.12" />
      <path d="M16.95 7.05l2.12-2.12" />
    </svg>
  ),
  pressure: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <path d="M12 22a10 10 0 1 1 0-20" />
      <path d="M12 2v4" />
      <path d="m12 6 9-3-3 9" />
    </svg>
  ),
  wind: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
  ),
};

/**
 * Three.js 轨道控制器封装
 * 允许用户通过鼠标拖拽、缩放旋转 3D 场景
 */
function Controls() {
  const { camera, gl } = useThree();
  const controls = useMemo(() => {
    const instance = new OrbitControls(camera, gl.domElement);
    instance.enableDamping = true;
    instance.dampingFactor = 0.08;
    instance.minDistance = 4.2;
    instance.maxDistance = 12;
    instance.minPolarAngle = 0.72;
    instance.maxPolarAngle = 1.28;
    instance.enablePan = false;
    instance.target.set(0.25, 0.42, 0);
    return instance;
  }, [camera, gl.domElement]);

  useFrame(() => controls.update());

  return <primitive object={controls} />;
}

/**
 * 3D 发光曲线组件
 * 使用 BufferGeometry 和 LineBasicMaterial 绘制一条发光线条
 * @param points 曲线经过的点位数组
 * @param color 线条发光颜色
 * @param opacity 透明度（0-1）
 */
function GlowLine({ points, color = '#36cfff', opacity = 0.65 }: { points: Vector3[]; color?: string; opacity?: number }) {
  const line = useMemo(() => {
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({ color, transparent: true, opacity });
    return new Line(geometry, material);
  }, [color, opacity, points]);

  return <primitive object={line} />;
}

/**
 * 3D 管道/管线组件
 * 使用 CatmullRomCurve3 和 TubeGeometry 绘制光滑管道
 * @param points 管道经过的点位
 * @param radius 管道半径
 * @param color 管道发光颜色
 * @param opacity 透明度
 * @param intensity 自发光强度
 */
function Tube({
  points,
  radius = 0.016,
  color = '#34d6ff',
  opacity = 0.95,
  intensity = 2.25,
}: {
  points: Vector3[];
  radius?: number;
  color?: string;
  opacity?: number;
  intensity?: number;
}) {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(points);
    return new TubeGeometry(curve, Math.max(8, points.length * 14), radius, 10, false);
  }, [points, radius]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} transparent opacity={opacity} />
    </mesh>
  );
}

/**
 * 3D 光束/支柱组件
 * 使用圆柱体模拟两点之间的光束或结构支柱
 * @param from 起点坐标
 * @param to 终点坐标
 * @param radius 光束半径
 * @param color 发光颜色
 * @param opacity 透明度
 * @param intensity 自发光强度
 */
function Beam({
  from,
  to,
  radius = 0.012,
  color = '#34d6ff',
  opacity = 0.95,
  intensity = 2.05,
}: {
  from: Vector3;
  to: Vector3;
  radius?: number;
  color?: string;
  opacity?: number;
  intensity?: number;
}) {
  const beam = useMemo(() => {
    const direction = new Vector3().subVectors(to, from);
    return {
      midpoint: new Vector3().addVectors(from, to).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize()),
      length: direction.length(),
    };
  }, [from, to]);

  return (
    <mesh position={beam.midpoint} quaternion={beam.quaternion}>
      <cylinderGeometry args={[radius, radius, beam.length, 10]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} transparent opacity={opacity} />
    </mesh>
  );
}

/**
 * 3D 植株模型组件
 * 使用圆柱体（树干）和球体（树冠）组合成一棵简笔植株
 * @param x 植株的 X 坐标
 * @param z 植株的 Z 坐标
 * @param scale 植株缩放比例
 */
function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, -0.69, z]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.035, 0.055, 0.3, 7]} />
        <meshStandardMaterial color="#17351d" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color="#1f7536" emissive="#0b4f25" emissiveIntensity={0.22} roughness={0.74} />
      </mesh>
      <mesh position={[0.13, 0.34, -0.08]}>
        <sphereGeometry args={[0.15, 9, 7]} />
        <meshStandardMaterial color="#2d8b42" emissive="#0a4d25" emissiveIntensity={0.18} roughness={0.76} />
      </mesh>
      <mesh position={[-0.12, 0.33, 0.08]}>
        <sphereGeometry args={[0.14, 9, 7]} />
        <meshStandardMaterial color="#185f2e" emissive="#073a1d" emissiveIntensity={0.18} roughness={0.78} />
      </mesh>
    </group>
  );
}

/**
 * 3D 园区地面和植株布局组件
 * 生成地面平面、小径和规则排列的植株
 */
function Park() {
  const trees = useMemo(() => {
    const list: Array<[number, number, number]> = [];
    for (let x = -12.8; x <= 12.8; x += 0.66) {
      for (let z = -7.2; z <= 7.2; z += 0.62) {
        const insideGreenhouse = x > -4.1 && x < 4.2 && z > -1.95 && z < 1.95;
        const roadBand = Math.abs(z + 2.35) < 0.2 || Math.abs(z - 2.28) < 0.18;
        const centerPath = Math.abs(x) < 4.3 && (Math.abs(z - 1.84) < 0.2 || Math.abs(z + 1.84) < 0.18);
        const centralOpening = x > -5.4 && x < 5.4 && z > -3.1 && z < 3.1;
        const forestEdge = Math.abs(x) > 5.8 || Math.abs(z) > 3.5;
        if (!insideGreenhouse && !roadBand && !centerPath && (!centralOpening || forestEdge)) {
          const jitterX = ((Math.sin(x * 12.7 + z * 4.2) + 1) / 2 - 0.5) * 0.16;
          const jitterZ = ((Math.cos(x * 5.3 - z * 8.1) + 1) / 2 - 0.5) * 0.14;
          const scale = 0.58 + ((Math.sin(x * 2.1 + z * 3.7) + 1) / 2) * 0.28;
          list.push([x + jitterX, z + jitterZ, scale]);
        }
      }
    }
    return list;
  }, []);

  return (
    <group>
      <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 18]} />
        <meshStandardMaterial color="#164424" emissive="#0b341d" emissiveIntensity={0.42} roughness={0.92} />
      </mesh>
      {[-12, -9, -6, -3, 0, 3, 6, 9, 12].map((x) => (
        <mesh key={x} position={[x, -0.692, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.02, 17.5]} />
          <meshStandardMaterial color="#2aa25b" emissive="#0b6336" emissiveIntensity={0.18} transparent opacity={0.26} />
        </mesh>
      ))}
      {[-7.2, -5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4, 7.2].map((z) => (
        <mesh key={z} position={[0, -0.691, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[29, 0.018]} />
          <meshStandardMaterial color="#2aa25b" emissive="#0b6336" emissiveIntensity={0.18} transparent opacity={0.24} />
        </mesh>
      ))}
      <mesh position={[0, -0.688, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.1, 4.16, 96]} />
        <meshStandardMaterial color="#36cfff" emissive="#127cff" emissiveIntensity={0.3} transparent opacity={0.24} />
      </mesh>
      <mesh position={[0, -0.682, -2.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13.4, 0.34]} />
        <meshStandardMaterial color="#465c60" emissive="#183845" emissiveIntensity={0.14} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.68, 2.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13.4, 0.26]} />
        <meshStandardMaterial color="#334e3f" emissive="#153b2a" emissiveIntensity={0.12} roughness={0.58} />
      </mesh>
      {[-1.84, 1.84].map((z) => (
        <mesh key={z} position={[0, -0.668, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7.25, 0.18]} />
          <meshStandardMaterial color="#78908b" transparent opacity={0.7} roughness={0.42} />
        </mesh>
      ))}
      {trees.map(([x, z, scale], index) => (
        <Tree key={index} x={x} z={z} scale={scale} />
      ))}
    </group>
  );
}

/**
 * 3D 温室主体模型组件
 * 使用 Beams（梁柱）、Tubes（拱架）和mesh（玻璃）组合成温室结构
 * 包含自动浮动动画（useFrame 驱动）
 */
function GreenhouseModel() {
  const groupRef = useRef<Group>(null);
  const length = 7.25;
  const depth = 2.85;
  const wallHeight = 1.05;
  const roofRise = 0.72;
  const xFrames = [-3.62, -3.05, -2.48, -1.91, -1.34, -0.77, -0.2, 0.37, 0.94, 1.51, 2.08, 2.65, 3.22, 3.62];
  const zGrid = [-1.42, -1.05, -0.7, -0.35, 0, 0.35, 0.7, 1.05, 1.42];
  const sideRails = [0.24, 0.5, 0.76, 1.02];
  const archY = (z: number) => wallHeight + roofRise * Math.max(0, 1 - Math.abs(z) / (depth / 2)) ** 0.55;
  const arch = (x: number) => zGrid.map((z) => new Vector3(x, archY(z), z));

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = -0.47 + Math.sin(state.clock.elapsedTime * 0.7) * 0.008;
  });

  return (
    <group ref={groupRef} position={[0.2, -0.5, 0]} rotation={[0, -0.18, 0]} scale={[0.86, 0.86, 0.86]}>
      <mesh position={[0, -0.055, 0]}>
        <boxGeometry args={[7.95, 0.08, 3.55]} />
        <meshStandardMaterial color="#d4dee8" emissive="#2b7196" emissiveIntensity={0.08} transparent opacity={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[length, wallHeight, depth]} />
        <meshPhysicalMaterial color="#19a8ff" transparent opacity={0.08} roughness={0.05} metalness={0.05} transmission={0.2} thickness={0.25} />
      </mesh>
      <mesh position={[0, wallHeight + 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[depth / 2, depth / 2, length, 36, 1, true, 0, Math.PI]} />
        <meshPhysicalMaterial color="#18b7ff" transparent opacity={0.06} roughness={0.04} transmission={0.22} thickness={0.2} side={2} />
      </mesh>

      <Beam from={new Vector3(-length / 2, 0, -depth / 2)} to={new Vector3(length / 2, 0, -depth / 2)} radius={0.018} />
      <Beam from={new Vector3(-length / 2, 0, depth / 2)} to={new Vector3(length / 2, 0, depth / 2)} radius={0.018} />
      <Beam from={new Vector3(-length / 2, 0, -depth / 2)} to={new Vector3(-length / 2, 0, depth / 2)} radius={0.018} />
      <Beam from={new Vector3(length / 2, 0, -depth / 2)} to={new Vector3(length / 2, 0, depth / 2)} radius={0.018} />
      <Beam from={new Vector3(-length / 2, wallHeight, -depth / 2)} to={new Vector3(length / 2, wallHeight, -depth / 2)} radius={0.017} />
      <Beam from={new Vector3(-length / 2, wallHeight, depth / 2)} to={new Vector3(length / 2, wallHeight, depth / 2)} radius={0.017} />
      <Beam from={new Vector3(-length / 2, wallHeight + roofRise, 0)} to={new Vector3(length / 2, wallHeight + roofRise, 0)} radius={0.022} color="#67e3ff" />

      {xFrames.map((x) => (
        <group key={x}>
          <Tube points={arch(x)} radius={x === -3.62 || x === 3.62 ? 0.018 : 0.012} color={x === -3.62 || x === 3.62 ? '#73e4ff' : '#24c5ff'} />
          <Beam from={new Vector3(x, 0, -depth / 2)} to={new Vector3(x, wallHeight, -depth / 2)} radius={0.011} />
          <Beam from={new Vector3(x, 0, depth / 2)} to={new Vector3(x, wallHeight, depth / 2)} radius={0.011} />
          <Beam from={new Vector3(x, wallHeight, -depth / 2)} to={new Vector3(x, wallHeight, depth / 2)} radius={0.008} opacity={0.55} />
        </group>
      ))}

      {sideRails.map((y) => (
        <group key={y}>
          <Beam from={new Vector3(-length / 2, y, -depth / 2)} to={new Vector3(length / 2, y, -depth / 2)} radius={0.008} opacity={0.62} />
          <Beam from={new Vector3(-length / 2, y, depth / 2)} to={new Vector3(length / 2, y, depth / 2)} radius={0.008} opacity={0.62} />
        </group>
      ))}

      {[-1.08, -0.72, -0.36, 0, 0.36, 0.72, 1.08].map((z) => (
        <Beam key={z} from={new Vector3(-length / 2, archY(z), z)} to={new Vector3(length / 2, archY(z), z)} radius={0.008} color="#19baff" opacity={0.58} />
      ))}

      <group position={[-length / 2 - 0.02, 0, 0]}>
        <Beam from={new Vector3(0, 0, -0.55)} to={new Vector3(0, 0.95, -0.55)} radius={0.016} color="#8cecff" />
        <Beam from={new Vector3(0, 0.95, -0.55)} to={new Vector3(0, 0.95, 0.55)} radius={0.016} color="#8cecff" />
        <Beam from={new Vector3(0, 0.95, 0.55)} to={new Vector3(0, 0, 0.55)} radius={0.016} color="#8cecff" />
        <Beam from={new Vector3(0, 0.46, -0.55)} to={new Vector3(0, 0.46, 0.55)} radius={0.008} opacity={0.68} />
        <Beam from={new Vector3(0, 0, -1.18)} to={new Vector3(0, 1.02, -1.18)} radius={0.012} color="#6fe4ff" opacity={0.82} />
        <Beam from={new Vector3(0, 0, 1.18)} to={new Vector3(0, 1.02, 1.18)} radius={0.012} color="#6fe4ff" opacity={0.82} />
        <Beam from={new Vector3(0, 1.02, -1.18)} to={new Vector3(0, 1.02, 1.18)} radius={0.012} color="#6fe4ff" opacity={0.82} />
      </group>

      {[-1.06, -0.52, 0.02, 0.56, 1.1].map((z) => (
        <mesh key={z} position={[0.18, 0.105, z]}>
          <boxGeometry args={[6.25, 0.1, 0.13]} />
          <meshStandardMaterial color="#58e89c" emissive="#18a86a" emissiveIntensity={0.8} transparent opacity={0.88} />
        </mesh>
      ))}

      {[-1.68, 1.68].map((z) => (
        <group key={z}>
          <mesh position={[0.15, 0.04, z]}>
            <boxGeometry args={[6.9, 0.08, 0.12]} />
            <meshStandardMaterial color="#1db86b" emissive="#0b7a48" emissiveIntensity={0.55} transparent opacity={0.78} />
          </mesh>
          {[-3.1, -2.55, -2, -1.45, -0.9, -0.35, 0.2, 0.75, 1.3, 1.85, 2.4, 2.95].map((x) => (
            <mesh key={x} position={[x, 0.12, z]}>
              <sphereGeometry args={[0.07, 12, 10]} />
              <meshStandardMaterial color="#62de7f" emissive="#148d4e" emissiveIntensity={0.45} />
            </mesh>
          ))}
        </group>
      ))}

      {[
        [-3.78, 0.03, -1.62],
        [3.82, 0.03, 1.58],
        [-0.1, 0.04, -1.76],
        [2.95, 0.04, -1.54],
        [2.9, 0.04, 1.66],
      ].map(([x, y, z], index) => (
        <mesh key={index} position={[x, y, z]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#79eaff" emissive="#16a9ff" emissiveIntensity={3.2} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Three.js 场景组件
 * 配置相机、光照、园区、温室模型和交互控制器
 */
function Scene() {
  return (
    <Canvas camera={{ position: [-5.4, 2.8, 5.4], fov: 35 }} gl={{ antialias: true, alpha: true }}>
      <color attach="background" args={['#020b15']} />
      <fog attach="fog" args={['#061423', 12, 34]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 4]} intensity={2.8} color="#d6f6ff" />
      <pointLight position={[-3.5, 2.2, 2.5]} intensity={4.2} color="#17a8ff" />
      <pointLight position={[3.2, 1.8, -2.4]} intensity={1.8} color="#28d881" />
      <Park />
      <GreenhouseModel />
      <Controls />
    </Canvas>
  );
}

/**
 * 温室监控主页面
 *
 * 核心功能：
 * - 3D 温室场景：使用 Three.js 渲染温室结构、植株和环境光照
 * - 传感器标签：在 3D 场景上叠加显示温湿度、光照等实时数据
 * - 指标卡片：展示当前温室的关键环境指标
 * - 气象面板：室外温度、风向和农时节气信息
 * - 24 小时温湿度趋势图：使用 ECharts 渲染折线图
 *
 * 所有数据来自 mock 模拟数据，后续可对接物联网传感器 API。
 *
 * @component
 */
export function GreenhousePage() {
  /** ECharts 24小时温湿度趋势图配置 */
  const chartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 16, 30, .92)',
      borderColor: '#2b91e8',
      textStyle: { color: '#e9f6ff' },
    },
    legend: { top: 0, right: 8, textStyle: { color: '#cfe8ff' }, data: greenhouseTrendSeries.map((item) => item.name) },
    grid: { left: 42, right: 20, top: 42, bottom: 30 },
    xAxis: {
      type: 'category',
      data: greenhouseTrendLabels,
      axisLabel: { color: '#9cb9d7' },
      axisLine: { lineStyle: { color: 'rgba(91, 184, 255, .34)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#9cb9d7' },
      splitLine: { lineStyle: { color: 'rgba(91, 184, 255, .12)' } },
    },
    series: greenhouseTrendSeries.map((item) => ({
      name: item.name,
      data: item.data,
      type: 'line',
      smooth: false,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { width: 2, color: item.color },
      itemStyle: { color: item.color },
      areaStyle: { color: item.areaColor },
    })),
  };

  return (
    <div className="greenhouse-page">
      <section className="greenhouse-hero">
        <div className="scene-wrap interactive-scene">
          <Scene />
          <div className="scene-grid" />
          {greenhouseFloatingSensors.map((item) => (
            <div key={item.label} className={`sensor-tag ${item.className}`}>
              <div className="sensor-icon">{greenhouseIconMap[item.icon]}</div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.unit}</small>
            </div>
          ))}
          <div className="connector connector-left-top" />
          <div className="connector connector-left-mid" />
          <div className="connector connector-left-low" />
          <div className="connector connector-right-top" />
          <div className="connector connector-right-mid" />
          <div className="connector connector-right-low" />
          <div className="model-cue">{text.cue}</div>
        </div>
      </section>

      <section className="greenhouse-section">
        <div className="section-title">
          <span />
          <Typography.Title level={4}>{text.metricsTitle}</Typography.Title>
        </div>
        <Space className="data-switch" size={10}>
          <span>{text.switchSource}</span>
          <button type="button">
            {text.boardOnline} <i /> {text.online}
          </button>
          <Button type="text" icon={<ReloadOutlined />} aria-label={text.refresh} />
        </Space>
        <div className="metric-grid">
          {greenhouseMetrics.map((item) => (
            <Card className="metric-tile" key={item.label}>
              <div className={`metric-type metric-${item.type}`}>{metricIconMap[item.type]}</div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.unit}</small>
            </Card>
          ))}
        </div>
        <div className="sync-status">
          <i />
          {text.syncing}
        </div>
      </section>

      <section className="greenhouse-bottom">
        <Card className="info-panel weather-card">
          <div className="section-title small">
            <span />
            <Typography.Title level={4}>{text.weatherTitle}</Typography.Title>
          </div>
          <div className="weather-content">
            <div className="clock-box">
              <strong>{greenhouseWeatherPanel.time}</strong>
              <span>{greenhouseWeatherPanel.date}</span>
              <small>{greenhouseWeatherPanel.lunar}</small>
            </div>
            <div className="crop-box">
              <ExperimentOutlined />
              <strong>{greenhouseWeatherPanel.crop}</strong>
              <span>{greenhouseWeatherPanel.solarTerm}</span>
            </div>
            <div className="weather-stat">
              <CloudOutlined />
              <strong>{greenhouseWeatherPanel.outdoorTemp}</strong>
              <span>{text.outdoorTemp}</span>
            </div>
            <div className="weather-stat">
              <CompassOutlined />
              <strong>{greenhouseWeatherPanel.wind}</strong>
              <span>{text.wind}</span>
            </div>
          </div>
          <div className="weather-location">
            <EnvironmentOutlined />
            {greenhouseWeatherPanel.location}
          </div>
        </Card>

        <Card className="info-panel trend-card">
          <div className="panel-heading">
            <div className="section-title small">
              <span />
              <Typography.Title level={4}>{text.trendTitle}</Typography.Title>
            </div>
            <div className="legend-inline">
              <i className="temp-dot" /> {text.tempLegend}
              <i className="humidity-dot" /> {text.humidityLegend}
            </div>
          </div>
          <div className="chart-shell">
            <ReactECharts option={chartOption} style={{ height: 210 }} />
            <div className="chart-loading">
              <LoadingOutlined />
              <span>{text.loading}</span>
            </div>
          </div>
        </Card>
      </section>

      <footer className="greenhouse-footnote">
        <FieldTimeOutlined />
        {text.footnote}
      </footer>
    </div>
  );
}
