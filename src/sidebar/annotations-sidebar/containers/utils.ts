import type {
    UnifiedAnnotation,
    UnifiedList,
} from 'src/annotations/cache/types'
import type { AnnotationCardInstanceLocation } from '../types'
import type { AnnotationCardInstance, ListInstance } from './types'

export const generateAnnotationCardInstanceId = (
    { unifiedId }: Pick<UnifiedAnnotation, 'unifiedId'>,
    instanceLocation: AnnotationCardInstanceLocation = 'annotations-tab',
): string => `${instanceLocation}-${unifiedId}`

export const initAnnotationCardInstance = (
    annot: Pick<UnifiedAnnotation, 'unifiedId' | 'comment'>,
): AnnotationCardInstance => ({
    unifiedAnnotationId: annot.unifiedId,
    comment: annot.comment ?? '',
    isCommentTruncated: true,
    isCommentEditing: false,
    cardMode: 'none',
})

export const initListInstance = (
    list: Pick<
        UnifiedList,
        'unifiedId' | 'unifiedAnnotationIds' | 'hasRemoteAnnotationsToLoad'
    >,
): ListInstance => ({
    sharedAnnotationReferences: list.hasRemoteAnnotationsToLoad
        ? []
        : undefined,
    annotationRefsLoadState: 'pristine',
    conversationsLoadState: 'pristine',
    annotationsLoadState: 'pristine',
    unifiedListId: list.unifiedId,
    isOpen: false,
})
