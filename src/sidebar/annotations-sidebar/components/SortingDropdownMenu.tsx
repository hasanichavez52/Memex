import React from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import {
    sortByCreatedTime,
    sortByPagePosition,
    AnnotationsSorter,
} from '../sorting'
import {
    DropdownMenuBtn,
    MenuItemProps,
} from 'src/common-ui/components/dropdown-menu-btn'

interface SortingMenuItemProps extends MenuItemProps {
    sortingFn: AnnotationsSorter
}

export const defaultSortingMenuItems: SortingMenuItemProps[] = [
    {
        name: 'Position on Page',
        sortingFn: sortByPagePosition,
    },
    {
        name: 'Creation time (new → old)',
        sortingFn: (a, b) => sortByCreatedTime(b, a),
    },
    {
        name: 'Creation time (old → new)',
        sortingFn: (a, b) => sortByCreatedTime(a, b),
    },
]

interface Props {
    onMenuItemClick: (props: SortingMenuItemProps) => void
    menuItems?: SortingMenuItemProps[]
    onClickOutSide?: React.MouseEventHandler
}

export class SortingDropdownMenuBtn extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = { menuItems: defaultSortingMenuItems }

    render() {
        return (
            <SortingContainer>
                {/* <SortingTitle>Sort Notes</SortingTitle> */}
                <DropdownMenuBtn
                    onMenuItemClick={this.props.onMenuItemClick}
                    menuItems={this.props.menuItems}
                    theme={{ leftMenuOffset: '35px' }}
                    btnId="DropdownMenuBtn"
                    keepSelectedState
                    onClickOutside={this.props.onClickOutSide}
                />
            </SortingContainer>
        )
    }
}

const SortingContainer = styled.div`
    padding: 5px;
`

const SortingTitle = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-weight: 700;
    padding-left: 10px;
    margin-top: 5px;
    font-size: 14px;
    margin-bottom: 5px;
`

const DropdownMenuContainer = styled.div`
    & > div {
        height: 24px;
        width: 24px;
        padding: 2px;
    }
`
