import explicitInjectableProvidedIn, {
    RULE_NAME as explicitInjectableProvidedInRuleName,
} from './rules/explicit-injectable-provided-in';

module.exports = {
    rules: {
        [explicitInjectableProvidedInRuleName]: explicitInjectableProvidedIn,
    },
};
