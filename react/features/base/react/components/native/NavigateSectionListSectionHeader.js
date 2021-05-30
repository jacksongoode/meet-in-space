// @flow

import React, { Component } from 'react';

import type { SetionListSection } from '../../Types';

import Container from './Container';
import Text from './Text';
import styles from './styles';

type Props = {

    /**
     * A section containing the data to be rendered
     */
    section: SetionListSection
}

/**
 * Implements a React/Native {@link Component} that renders the section header
 * of the list
 *
 * @extends Component
 */
export default class NavigateSectionListSectionHeader extends Component<Props> {
    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {
        const { section } = this.props.section;

        return (
            <Container style = { styles.listSection }>
                <Text style = { styles.listSectionText }>
                    { section.title }
                </Text>
            </Container>
        );
    }
}
