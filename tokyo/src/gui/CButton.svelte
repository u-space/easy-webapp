<script lang="ts">
	import {CButtonProps, CButtonVariant} from './CButton';
	import CTooltip from '@tokyo/gui/CTooltip.svelte';
	import CSizeWrapper from "@tokyo/gui/CSizeWrapper.svelte";
	import {CSize} from './CSizeWrapper';

	export let variant: CButtonProps['variant'] = CButtonVariant.PRIMARY;
	export let size: CButtonProps['size'] = CSize.MEDIUM;
	export let icon: CButtonProps['icon'] = undefined;
	export let fill: CButtonProps['fill'] = false;

	export let tooltip: CButtonProps['tooltip'] = undefined;
	export let disabled: CButtonProps['disabled'] = false;

	let open = false;
</script>

<CSizeWrapper {size}>
	<button
			{...$$restProps}
			on:click
			class:primary={variant === CButtonVariant.PRIMARY && !disabled}
			class:secondary={variant === CButtonVariant.SECONDARY && !disabled}
			class:danger={variant === CButtonVariant.DANGER && !disabled}
			class:disabled={disabled}
			class:only_icon={!$$slots.default && icon} class:icon_and_text={$$slots.default && icon}
			class:icon_or_text={($$slots.default || icon) && !($$slots.default && icon)}
			class:fill={fill}
			on:mouseenter={() => open = true} on:mouseleave={() => open = false}
	>
		{#if icon}
			<iconify-icon height="1.5em" icon={`ph:${icon}`}></iconify-icon>
		{/if}
		{#if tooltip}
			<CTooltip {...{text: '', position: 'bottom', ...tooltip, open}}/>
		{/if}
		{#if $$slots.default}
			<p>
				<slot></slot>
			</p>
		{/if}
	</button>
</CSizeWrapper>

<style lang="scss">
  @import './mixins.scss';

  $button-shift-action: 0.1em;

  button {
    position: relative;
    flex: 0;

    display: flex;
    align-items: center;

    overflow: visible; // To be able to draw the small overhang of the button that shows on hover

    width: auto;
    max-width: 100%;
    height: 1.70em;

    user-select: none;
    font-family: 'Lexend Deca', sans-serif;
    text-align: right;
    font-size: 1em;
    border-radius: var(--c-radius-s);
    box-shadow: inset 0 0 0 1px rgba(17, 20, 24, 0.2), 0 1px 2px rgba(17, 20, 24, 0.1);

    transform: translate3d(
                    0,
                    0,
                    0
    ); // https://stackoverflow.com/questions/48748223/really-weird-box-shadow-transition-bug

    @include no-outline;


    & p {
      margin: auto 0;
      width: 100%;
      height: 100%;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    &:hover {
      transform: translateY(-$button-shift-action);

      &::after {
        // To prevent a fast effect when the button is hovered (moving the button up and down)
        content: '';
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        height: $button-shift-action;

        background: transparent;
      }
    }

    &:active {
      transform: translateY($button-shift-action);
    }

    &:focus {
      outline: 1px solid var(--primary-500);
    }
  }

  .fill {
    width: 100%;
    max-width: 100%;
  }

  .only_icon {
    aspect-ratio: 13/9;
  }

  .icon_or_text {
    justify-content: center;
    gap: 0;
  }

  .icon_and_text {
    justify-content: space-between;
    gap: 0.5em;
  }

  .primary {
    color: var(--white-100) !important;

    background: var(--primary-500) !important;

    &:hover {
      background: var(--primary-400) !important;
    }

    &:active {
      background: var(--primary-600) !important;
    }
  }

  .secondary {
    color: var(--mirai-900) !important;

    background: var(--mirai-150) !important;

    &:hover {
      background: var(--mirai-100) !important;
    }

    &:active {
      background: var(--mirai-200) !important;
    }
  }

  .danger {
    color: var(--white-100) !important;

    background: var(--ramen-500) !important;

    &:hover {
      background: var(--ramen-400) !important;
    }

    &:active {
      background: var(--ramen-600) !important;
    }
  }

  .disabled {
    background: var(--mirai-700) !important;

    cursor: not-allowed;

    &:hover,
    &:active {
      background: var(--mirai-700) !important;
      transform: none;
    }
  }


</style>
