import PropTypes from 'prop-types'
import styled from 'styled-components'
import { InferPropTypes } from '../types'

const BoxPropTypes = {
    borderWidth: PropTypes.string,
    borderRadius: PropTypes.string,
    invert: PropTypes.bool,
    padding: PropTypes.string,
}

const BoxDefaultProps = {
    borderWidth: '0px',
    borderRadius: 'var(--border-radius)',
    invert: false,
    padding: 'var(--s1)',
}

type BoxProps = InferPropTypes<typeof BoxPropTypes, typeof BoxDefaultProps>

const Box = styled.div<BoxProps>`
    ${(props) =>
        props.invert
            ? `
    background-color: var(--background-color);
    filter: invert(100%);`
            : ''}

    ${(props) =>
        props.borderRadius
            ? `
    border-radius: ${props.borderRadius};`
            : ''}

  background-color: inherit;
    border-width: ${(props) => props.borderWidth};
    border-color: '#fff';
    display: block;
    padding: ${(props) => props.padding};

    /* ↓ For high contrast mode */
    outline: var(--border-thin) solid transparent;
    outline-offset: calc(var(--border-thin) * -1);
`

Box.propTypes = BoxPropTypes
Box.defaultProps = BoxDefaultProps

export default Box
