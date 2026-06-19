import { assetService } from '~/services/asset-service'
import type { Asset } from '~/types/asset'

export const useCurrentAsset = () => {
  const asset = useState<Asset | null>('current-asset', () => null)
  const isLoading = useState<boolean>('current-asset-loading', () => true)

  const fetchAsset = async (id: number) => {
    if (asset.value?.id === id) {
      isLoading.value = false
      return
    }

    isLoading.value = true
    try {
      const response = await assetService.getById(id)
      if (response.success) {
        asset.value = response.data
      }
    } catch (error) {
      // In case of error, we can handle it or let the component redirect
      asset.value = null
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    asset,
    isLoading,
    fetchAsset
  }
}
