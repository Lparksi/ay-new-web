import * as XLSX from 'xlsx'

// 模拟 tagOptions
const tagOptions = [
  { id: 1, name: '美食', alias: 'food' },
  { id: 2, name: '超市', alias: 'supermarket' },
  { id: 3, name: '咖啡', alias: 'coffee' },
]

function headerMapLookup(trimmed: string) {
  const headerMap: Record<string, string> = {
    '法人': 'legal_name',
    '经营地址': 'address',
    '商圈': 'area',
  }
  return headerMap[trimmed] || trimmed
}

function parseJsonRows(json: any[]) {
  return json.map(row => {
    const out: any = {}
    for (const key in row) {
      const trimmed = String(key).trim()
      const field = headerMapLookup(trimmed)
      out[field] = row[key]
    }
    out.legal_name = out.legal_name || out['法人'] || ''
    out.address = out.address || out['经营地址'] || ''
    out.area = out.area || out['商圈'] || ''

    const rawTags = out.tags || out['标签'] || ''
    if (rawTags) {
      const names = String(rawTags).split(/[,;；，\n]/).map((s: string) => s.trim()).filter((s: string) => s)
      const ids: number[] = []
      for (const name of names) {
        const found = tagOptions.find((t: any) => (t.name && t.name.toLowerCase() === name.toLowerCase()) || (t.alias && String(t.alias).toLowerCase() === name.toLowerCase()))
        if (found) ids.push(found.id)
      }
      out.tags = ids
    } else {
      if (!Array.isArray(out.tags)) out.tags = []
    }

    out.lng = null
    out.lat = null
    out.geocode_level = out.geocode_level || ''
    out.geocode_score = null
    out.geocode_description = out.geocode_description || '等待解析'

    return out
  })
}

// 测试数据
const sample = [
  { '法人': '张三', '经营地址': '某街道 1 号', '标签': '美食, 咖啡' },
  { '法人': '李四', '经营地址': '另一地址', '标签': '超市' },
  { '法人': '王五', '经营地址': '第三地址', '标签': '未知标签' },
]

console.log(parseJsonRows(sample))
