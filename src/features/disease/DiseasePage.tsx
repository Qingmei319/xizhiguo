/**
 * 果蔬品种图鉴页面（Disease / Atlas）
 *
 * 展示亚热带果蔬品种数据库，支持按品类筛选和品种详情查看。
 * 页面结构：
 * 1. 顶部标题区 — 页面主标题和说明文字
 * 2. 品类筛选导航 — 支持全部品类、葡萄类、柑橘类等分类切换
 * 3. 品种卡片网格 — 展示品种图片、名称和简介
 * 4. 品种详情弹窗 — 点击卡片后展示大图、详细描述和栽培说明
 *
 * 注：此页面当前为品种展示功能，病害识别功能在后续迭代中实现。
 *
 * @module features/disease
 */

import { CloseOutlined } from '@ant-design/icons';
import { Button, Empty, Spin, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import cherryTomatoImage from '@/assets/produce/cherry-tomato.jpg';
import dragonFruitImage from '@/assets/produce/dragon-fruit.jpg';
import grapeImage from '@/assets/produce/grape.jpg';
import mangoImage from '@/assets/produce/mango.jpg';
import orangeImage from '@/assets/produce/orange.jpg';
import { reportApiError } from '@/services/http';
import { getPlantCategories, getPlants, type Plant, type PlantCategory } from '@/services/plants.service';
import './index.less';

/** 果蔬品种数据接口 */
const fallbackImages = [grapeImage, orangeImage, dragonFruitImage, mangoImage, cherryTomatoImage];

function getPlantImage(item: Plant, index = 0) {
  return item.cover_image || item.images?.[0] || fallbackImages[index % fallbackImages.length];
}

function getPlantIntro(item: Plant) {
  return item.description?.replace(/<[^>]+>/g, '').slice(0, 52) || item.growth_location || item.tags.join('、') || '暂无简介';
}

function getPlantDetail(item: Plant) {
  return (
    item.description?.replace(/<[^>]+>/g, '') ||
    [item.growth_location && `生长地点：${item.growth_location}`, item.growth_cycle && `生长周期：${item.growth_cycle}`, item.suitable_temperature && `适宜温度：${item.suitable_temperature}`]
      .filter(Boolean)
      .join('；') ||
    '暂无详情'
  );
}

/**
 * 果蔬品种图鉴主页面
 *
 * 核心功能：
 * - 品类筛选：支持按葡萄类、柑橘类、火龙果类等 8 个品类筛选
 * - 品种卡片展示：网格布局展示品种图片、名称和简介
 * - 品种详情弹窗：点击卡片后展示大图、详细描述和栽培说明
 *
 * 数据来源：本地模拟数据（varieties 数组）
 *
 * @component
 */
export function DiseasePage() {
  const [categories, setCategories] = useState<PlantCategory[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getPlantCategories(), getPlants()])
      .then(([nextCategories, nextPlants]) => {
        setCategories(nextCategories);
        setPlants(nextPlants);
        setSelectedItem(nextPlants[0] || null);
      })
      .catch((error) => reportApiError(error, '果蔬档案获取失败'))
      .finally(() => setLoading(false));
  }, []);

  /** 根据当前选中的品类筛选品种列表 */
  const displayedItems = useMemo(() => {
    if (!activeCategoryId) return plants;
    return plants.filter((item) => item.category_id === activeCategoryId);
  }, [activeCategoryId, plants]);

  return (
    <div className="atlas-page">
      <section className="atlas-heading">
        <div>
          {/* <Typography.Text className="atlas-kicker">基因智查 / 品种展示库</Typography.Text> */}
          <Typography.Title level={2}>果蔬品种图鉴</Typography.Title>
          <Typography.Paragraph>面向智慧农业平台的果蔬品种数据库，聚合品种图像、核心特征与栽培适应性信息。</Typography.Paragraph>
        </div>
      </section>

      <nav className="atlas-categories" aria-label="果蔬品类">
        <Button
          type={activeCategoryId === null ? 'primary' : 'default'}
          onClick={() => setActiveCategoryId(null)}
        >
          全部品类
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            type={activeCategoryId === category.id ? 'primary' : 'default'}
            onClick={() => setActiveCategoryId(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </nav>

      <Spin spinning={loading}>
        <section className="atlas-grid" aria-label="果蔬品种列表">
          {displayedItems.map((item, index) => (
            <button className="atlas-card" key={item.id} type="button" onClick={() => setSelectedItem(item)}>
              <span className="atlas-card-image">
                <img src={getPlantImage(item, index)} alt={item.name} />
              </span>
              <span className="atlas-card-body">
                <strong>{item.name}</strong>
                <span>{getPlantIntro(item)}</span>
              </span>
            </button>
          ))}
        </section>
        {!loading && displayedItems.length === 0 && <Empty description="暂无果蔬档案" />}
      </Spin>

      {selectedItem && (
        <div className="atlas-modal-layer" role="presentation">
          <div className="atlas-modal" role="dialog" aria-modal="true" aria-labelledby="atlas-modal-title">
            <Button className="atlas-modal-close" type="text" icon={<CloseOutlined />} onClick={() => setSelectedItem(null)} />
            <div className="atlas-modal-image">
              <img src={getPlantImage(selectedItem)} alt={selectedItem.name} />
            </div>
            <div className="atlas-modal-content">
              <Typography.Text className="atlas-modal-label">{selectedItem.category_name || '未分类'}</Typography.Text>
              <Typography.Title id="atlas-modal-title" level={3}>
                {selectedItem.name}
              </Typography.Title>
              <Typography.Paragraph>{getPlantDetail(selectedItem)}</Typography.Paragraph>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
