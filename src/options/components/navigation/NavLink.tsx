import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import cx from 'classnames'
import { css } from 'styled-components'

import { OutLink } from 'src/common-ui/containers'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

export type Props = {
    name: String
    icon: String
    pathname: String
    isActive: Boolean
    isExternal: Boolean
}

class NavLink extends PureComponent<Props> {
    static propTypes = {}

    get LinkComponent() {
        return this.props.isExternal ? OutLink : Link
    }

    render() {
        return (
            <RouteItem name={this.props.name} isActive={this.props.isActive}>
                <this.LinkComponent to={this.props.pathname}>
                    <RouteItemContent>
                        <Icon
                            filePath={'img/' + this.props.icon}
                            heightAndWidth="20px"
                            hoverOff
                            color={this.props.isActive && 'purple'}
                        />
                        <RouteTitle isActive={this.props.isActive}>
                            {this.props.name}
                        </RouteTitle>
                    </RouteItemContent>
                </this.LinkComponent>
            </RouteItem>
        )
    }
}

const RouteTitle = styled.div<{ name: string; isActive: boolean }>`
    color: ${(props) =>
        props.isActive
            ? props.theme.colors.darkerText
            : props.theme.colors.normalText};
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    text-decoration: none;
    display: flex;
    justify-content: flex-start;
`

const RouteItemContent = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
`

const RouteItem = styled.li<{ name: string; isActive: boolean }>`
    display: grid;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    padding: 0 35px;
    height: 50px;

    & > a {
        display: flex;
        text-decoration: none;
    }

    &: hover {
        background-color: ${(props) => props.theme.colors.lightHover};
    }

    ${(props) =>
        props.name === 'Back to Dashboard' &&
        css`
            margin-bottom: 100px;
            margin-top: 20px;
        `};
`

export default NavLink
