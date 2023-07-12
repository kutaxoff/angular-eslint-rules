import { ASTUtils, RuleFixes, Selectors } from '@angular-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { createESLintRule } from '../utils/create-eslint-rule';

type Options = [{ readonly ignoreClassNamePattern?: string }];
export type MessageIds = 'explicitInjectableProvidedIn' | 'deprecatedInjectableProvidedIn' | 'suggestInjector';
export const RULE_NAME = 'explicit-injectable-provided-in';
const METADATA_PROPERTY_NAME = 'providedIn';

export default createESLintRule<Options, MessageIds>({
    name: RULE_NAME,
    meta: {
        type: 'suggestion',
        docs: {
            description: `Using the \`${METADATA_PROPERTY_NAME}\` property makes \`Injectables\` tree-shakable`,
            recommended: false,
        },
        hasSuggestions: true,
        schema: [
            {
                type: 'object',
                properties: {
                    ignoreClassNamePattern: {
                        type: 'string',
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            explicitInjectableProvidedIn: `The \`${METADATA_PROPERTY_NAME}\` property is mandatory for \`Injectables\``,
            deprecatedInjectableProvidedIn: `This value for \`${METADATA_PROPERTY_NAME}\` is deprecated. Use \`\'root\'\`, \`\'platform\'\` or \`null\` instead`,
            suggestInjector: `Use \`${METADATA_PROPERTY_NAME}: {{injector}}\``,
        },
    },
    defaultOptions: [{}],
    create(context, [{ ignoreClassNamePattern }]) {
        const injectableClassDecorator = `ClassDeclaration:not([id.name=${ignoreClassNamePattern}]):not(:has(TSClassImplements:matches([expression.property.name='HttpInterceptor'], [expression.name='HttpInterceptor']))) > Decorator[expression.callee.name="Injectable"]`;
        const providedInMetadataProperty = Selectors.metadataProperty(
            METADATA_PROPERTY_NAME,
        );
        const withoutProvidedInDecorator = `${injectableClassDecorator}:matches([expression.arguments.length=0], [expression.arguments.0.type='ObjectExpression']:not(:has(${providedInMetadataProperty})))`;
        const deprecatedProvidedInProperty = `${injectableClassDecorator} ${providedInMetadataProperty}:not(:matches([value.type='Literal'][value.raw='null'], [value.value='root'], [value.value='platform']))`;
        const selectors = [
            withoutProvidedInDecorator,
            deprecatedProvidedInProperty,
        ].join(',');

        const createSuggestion = (node: TSESTree.Decorator | TSESTree.Property) => (['\'root\'', '\'platform\'', null] as const).map((injector) => ({
            messageId: 'suggestInjector' as MessageIds,
            fix: (fixer) => {
                return ASTUtils.isProperty(node)
                    ? fixer.replaceText(node.value, `${injector}`)
                    : RuleFixes.getDecoratorPropertyAddFix(
                        node,
                        fixer,
                        `${METADATA_PROPERTY_NAME}: ${injector}`,
                    ) ?? [];
            },
            data: { injector },
        }))

        return {
            [withoutProvidedInDecorator](node: TSESTree.Decorator | TSESTree.Property) {
                context.report({
                    node: ASTUtils.isProperty(node) ? node.value : node,
                    messageId: 'explicitInjectableProvidedIn',
                    suggest: createSuggestion(node),
                });
            },
            [deprecatedProvidedInProperty](node: TSESTree.Decorator | TSESTree.Property) {
                context.report({
                    node: ASTUtils.isProperty(node) ? node.value : node,
                    messageId: 'deprecatedInjectableProvidedIn',
                    suggest: createSuggestion(node),
                });
            },
        };
    },
});
