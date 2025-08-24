// 格式化 Tag 对象为 "类别：别名 标签名称"
export function formatTagLabel(tag: any): string {
  if (!tag) return ''
  const cls = tag.class ? String(tag.class).trim() : ''
  const alias = tag.alias ? String(tag.alias).trim() : ''
  const name = tag.name || tag.tag_name || ''
  if (cls) return `${cls}：${alias ? alias + ' ' : ''}${name}`.trim()
  return `${alias ? alias + ' ' : ''}${name}`.trim()
}
