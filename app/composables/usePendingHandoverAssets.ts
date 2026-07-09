import { handoverService } from '~/services/handover-service'

/**
 * Fetches the set of asset IDs currently tied to a pending handover (assign or return).
 * Used to block actions (e.g. status change) on assets that are mid-handover.
 */
export function usePendingHandoverAssets() {
  const pendingAssetIds = ref<Set<number>>(new Set())
  const isLoading = ref(false)

  const fetchPendingAssets = async () => {
    isLoading.value = true
    try {
      const res = await handoverService.getAll(1, 200, '', '', '', 'pending')
      if (res.success && res.data) {
        const ids = new Set<number>()
        res.data.forEach(h => h.items.forEach((i) => {
          if (i.asset) ids.add(i.asset.id)
        }))
        pendingAssetIds.value = ids
      }
    } finally {
      isLoading.value = false
    }
  }

  return { pendingAssetIds, isLoading, fetchPendingAssets }
}
