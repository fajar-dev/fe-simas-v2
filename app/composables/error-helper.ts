import axios from 'axios'

export const handleServiceError = (error: any): never => {
    if (axios.isCancel(error)) {
        throw error
    }

    const toast = useToast()
    const responseData = error.response?.data
    
    let title = responseData?.message || 'Gagal'
    let message = ''
    
    if (error.response?.status === 422 && responseData?.errors) {
        message = responseData.errors.map((err: any) => err.message).join(', ')
    } else {
        message = responseData?.message || error.message || error || 'Terjadi kesalahan'
        if (message === title) message = '' 
    }
    
    toast.add({
        title: title,
        description: message,
        icon: 'i-lucide-circle-x',
        color: 'error'
    })
    
    throw new Error()
}