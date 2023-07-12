import explicitInjectableProvidedIn, {
    RULE_NAME as explicitInjectableProvidedInRuleName,
} from './rules/explicit-injectable-provided-in';

export default {
    rules: {
        [explicitInjectableProvidedInRuleName]: explicitInjectableProvidedIn,
    },
};
